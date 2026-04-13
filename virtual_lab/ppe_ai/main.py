# main.py
import os
import threading
import tempfile
import base64
import warnings

# Hide that PyTorch FutureWarning spam (optional)
warnings.filterwarnings("ignore", category=FutureWarning)

import flet as ft
import cv2
from ultralytics import YOLO

# -----------------------------
# Config
# -----------------------------
MODEL_PATH = os.environ.get("C:/Users/arka/PPE_OSH", "best.pt")  # set env var if needed
PORT = int(os.environ.get("PORT", 8550))
HOST = "0.0.0.0"

# -----------------------------
# Load model (may be slow)
# -----------------------------
try:
    model = YOLO(MODEL_PATH)
except Exception as ex:
    model = None
    print("⚠️ Failed to load model:", ex)

# -----------------------------
# Class map
# -----------------------------
CLASS_MAP = {
    0: "Hardhat",
    1: "Mask",
    2: "NO-Hardhat",
    3: "NO-Mask",
    4: "NO-Safety Vest",
    5: "Person",
    6: "Safety Cone",
    7: "Safety Vest",
    8: "machinery",
    9: "vehicle"
}

# -----------------------------
# Valid transparent placeholder (800x600)
# -----------------------------
BLANK_IMAGE = (
    "iVBORw0KGgoAAAANSUhEUgAAAyAAAAJYCAIAAADtnu9iAAAAGXRFWHRTb2Z0d2Fy"
    "ZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABh0"
    "RVh0Q3JlYXRpb24gVGltZQAwMy8wMi8xOZMKsE0AAABTSURBVHja7cExAQAAAMKg"
    "9U9tCF8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAPgGAX4AAZr9hV4AAAAASUVORK5CYII="
)

# -----------------------------
# Helpers
# -----------------------------
def encode_frame_to_base64_jpg(frame):
    """Encode BGR OpenCV frame to base64 JPEG string for ft.Image.src_base64"""
    _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    return base64.b64encode(buffer).decode("utf-8")


# -----------------------------
# Detection loop (runs in background thread)
# -----------------------------
run_flag = False  # stop flag


def detection_loop(video_source, page: ft.Page, img_ui: ft.Image, stats_ui: ft.Text):
    """
    video_source: either path to video file, or integer camera index (0)
    page.call_from_thread(...) is used to update UI safely from this thread.
    """
    global run_flag
    run_flag = True

    # Attempt to open capture
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        page.call_from_thread(lambda: (
            setattr(stats_ui, "value", "❌ Unable to open video source."),
            stats_ui.update()
        ))
        return

    # Process frames
    while run_flag:
        ret, frame = cap.read()
        if not ret:
            break

        # Ensure model loaded
        if model is None:
            # write message and break
            page.call_from_thread(lambda: (
                setattr(stats_ui, "value", "⚠️ Model not loaded. Check console."),
                stats_ui.update()
            ))
            break

        # Run YOLO inference (single image)
        try:
            results = model(frame)[0]  # Ultralytics returns a batch; take first
        except Exception as e:
            # error during inference
            page.call_from_thread(lambda: (
                setattr(stats_ui, "value", f"⚠️ Inference error: {e}"),
                stats_ui.update()
            ))
            break

        workers = helmets = vests = 0

        # Draw boxes and labels
        for box in results.boxes:
            cls = int(box.cls[0]) if hasattr(box, "cls") else int(box.cls)
            label = CLASS_MAP.get(cls, f"cls{cls}")
            x1, y1, x2, y2 = map(int, box.xyxy[0]) if hasattr(box.xyxy, "__len__") else map(int, box.xyxy)
            # draw
            cv2.rectangle(frame, (x1, y1), (x2, y2), (22, 195, 45), 2)
            cv2.putText(frame, label, (max(5, x1), max(20, y1 - 6)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (22, 195, 45), 2)

            # counts
            if label == "Person":
                workers += 1
            elif label == "Hardhat":
                helmets += 1
            elif label == "Safety Vest":
                vests += 1

        # encode and update UI via page.call_from_thread
        img_b64 = encode_frame_to_base64_jpg(frame)
        stat_text = f"🧑 Workers: {workers}   |   ⛑ Helmet: {helmets}   |   🔶 Vest: {vests}"

        page.call_from_thread(lambda: (
            setattr(img_ui, "src_base64", img_b64),
            img_ui.update(),
            setattr(stats_ui, "value", stat_text),
            stats_ui.update()
        ))

    cap.release()
    # On exit, restore placeholder
    page.call_from_thread(lambda: (
        setattr(img_ui, "src_base64", BLANK_IMAGE),
        img_ui.update()
    ))


# -----------------------------
# Flet main
# -----------------------------
def main(page: ft.Page):
    page.title = "PPE Detection — Dr. Arkaprabha Sau"
    page.padding = 18
    page.scroll = "adaptive"
    page.window_width = 1100

    # Header
    header = ft.Row(
        [
            ft.Column(
                [
                    ft.Text("🛡 PPE Detection (Web UI)", size=28, weight=ft.FontWeight.BOLD),
                    ft.Text("Developer: Dr. Arkaprabha Sau", size=14, color=ft.colors.RED_500),
                ],
                tight=True,
            ),
            ft.Container(expand=True),
            ft.Container(
                ft.Text("Status: Ready", key="status_text"),
                padding=ft.padding.symmetric(8, 6),
                bgcolor=ft.colors.GREEN_50,
                border_radius=6,
            ),
        ],
        alignment="center",
        vertical_alignment="center",
    )

    # Stats text
    stats = ft.Text("🧑 Workers: 0   |   ⛑ Helmet: 0   |   🔶 Vest: 0",
                    size=18, weight=ft.FontWeight.BOLD, color=ft.colors.BLUE_700)

    # Image area
    img_area = ft.Image(
        src_base64=BLANK_IMAGE,
        width=900,
        height=600,
        fit=ft.ImageFit.CONTAIN,
        border_radius=8,
    )

    # File picker (added to overlay)
    file_picker = ft.FilePicker(on_result=lambda e: on_pick_result(e, page, img_area, stats))
    page.overlay.append(file_picker)

    # Buttons
    upload_btn = ft.ElevatedButton(
        "📤 Upload Video",
        on_click=lambda _: file_picker.pick_files(allow_multiple=False, read_bytes=True),
        tooltip="Upload a video file from your computer (mp4, avi, ...)"
    )

    # Webcam button will attempt to start camera on server side (only works if server has camera)
    start_cam_btn = ft.ElevatedButton(
        "🎥 Start Webcam (Server-side)",
        on_click=lambda _: start_webcam(page, img_area, stats),
        tooltip="Starts server-side webcam (only works if the server has a camera)."
    )

    stop_btn = ft.ElevatedButton(
        "⛔ Stop",
        on_click=lambda _: stop_detection(page),
        bgcolor=ft.colors.RED_400,
        color=ft.colors.WHITE
    )

    controls_row = ft.Row([upload_btn, start_cam_btn, stop_btn], alignment="center", spacing=20)

    # Layout cards
    stats_card = ft.Card(elevation=6, content=ft.Container(stats, padding=12))
    video_card = ft.Card(
        elevation=10,
        content=ft.Container(
            img_area,
            padding=10,
            bgcolor=ft.colors.BLACK,
            border_radius=8
        )
    )
    controls_card = ft.Card(elevation=6, content=ft.Container(controls_row, padding=14))

    # Footer note
    footer = ft.Text(
        "💡 Note: Heavy YOLO processing runs on the server (this machine). "
        "Open this app in your browser at the URL printed in the terminal.",
        size=12,
        color=ft.colors.BLUE_ACCENT_700
    )

    # Add to page
    page.add(header, stats_card, video_card, controls_card, footer)

   
# -----------------------------
# File picker handler
# -----------------------------
def on_pick_result(e: ft.FilePickerResultEvent, page: ft.Page, img_ui: ft.Image, stats_ui: ft.Text):
    """
    Handles the file picker result. The call to pick_files used with_data=True,
    so uploaded_file.bytes should exist in web mode.
    """
    if not e.files:
        return

    uploaded_file = e.files[0]

    # Ensure bytes present (we used with_data=True when picking)
    file_bytes = getattr(uploaded_file, "bytes", None)
    if not file_bytes:
        page.snack_bar = ft.SnackBar(ft.Text("❌ Could not read file bytes. Retry with a modern browser."))
        page.snack_bar.open = True
        page.update()
        return

    # Save to tmp file
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    tmp.write(file_bytes)
    tmp.close()
    video_path = tmp.name

    # start detection in background thread
    t = threading.Thread(target=detection_loop, args=(video_path, page, img_ui, stats_ui), daemon=True)
    t.start()


# -----------------------------
# Start webcam (server-side)
# -----------------------------
def start_webcam(page: ft.Page, img_ui: ft.Image, stats_ui: ft.Text):
    # start camera index 0 on server
    t = threading.Thread(target=detection_loop, args=(0, page, img_ui, stats_ui), daemon=True)
    t.start()


# -----------------------------
# Stop detection
# -----------------------------
def stop_detection(page: ft.Page):
    global run_flag
    run_flag = False
    # update status
    page.snack_bar = ft.SnackBar(ft.Text("Stopped detection."))
    page.snack_bar.open = True
    page.update()


# -----------------------------
# Run app
# -----------------------------
if __name__ == "__main__":
    # IMPORTANT: For web mode, use view=WEB_BROWSER (this starts a local server)
    ft.app(target=main, view=ft.WEB_BROWSER, port=PORT, host=HOST)
