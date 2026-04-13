# Eye Fatigue Guard | Premium AI Monitor

A real-time web application that detects eye fatigue using computer vision. It monitors blink rates and alerts the user if their eyes remain closed for more than 2 seconds using visual and auditory alarms.

## Features

*   **Real-time Eye Tracking**: Uses MediaPipe Face Mesh for high-precision eye tracking.
*   **Fatigue Detection**: accurately interprets "Eyes Closed" state vs normal blinking.
*   **Instant Alerts**:
    *   **Visual**: Screen flashes red to demand attention.
    *   **Audio**: High-pitch alarm sounds to wake the user.
*   **Premium UI**: Dark, glassmorphism-inspired design with neon aesthetics.
*   **Privacy First**: All processing happens locally in your browser. No video is sent to any server.

## How to Run

Due to browser security restrictions on camera access, this application **cannot be run directly** by double-clicking the `index.html` file. It must be served via a local web server.

### Option 1: Using Python (Recommended)
If you have Python installed (pre-installed on most developer machines):

1.  Open a terminal/command prompt in this folder.
2.  Run the following command:
    ```bash
    python -m http.server 8000
    ```
3.  Open your browser and go to:
    [http://localhost:8000](http://localhost:8000)

### Option 2: Using Node.js
If you have Node.js installed:

1.  Open a terminal in this folder.
2.  Run:
    ```bash
    npx serve
    ```
3.  Open the local URL provided (usually `http://localhost:3000`).

## Usage

1.  Click **"Start Monitoring"**.
2.  Allow camera permissions when prompted.
3.  Ensure your face is well-lit and visible in the frame.
4.  **Test**: Close your eyes for 3 seconds to trigger the alarm. Open them to stop it.

## Developer Credits

**Dr. Arkaprabha Sau**
*   MBBS, MD (Gold Medalist)
*   PhD (Computer Science & Engineering)
*   DPH, Dip. Geriatric Medicine, Certificate in Diabetes Management
