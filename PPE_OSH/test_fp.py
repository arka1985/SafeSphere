import flet as ft

def main(page: ft.Page):
    def on_pick(e: ft.FilePickerResultEvent):
        if not e.files:
            print("No files selected")
            return

        f = e.files[0]
        print("Object type:", type(f))
        print("Attributes:", dir(f))

        # Print which attributes might contain file data
        print("\nPossible data attributes:")
        for a in dir(f):
            if "content" in a or "bytes" in a or "data" in a:
                print("  ->", a)
        
    fp = ft.FilePicker(on_result=on_pick)
    page.overlay.append(fp)

    page.add(
        ft.ElevatedButton(
            "Pick File",
            on_click=lambda _: fp.pick_files(allow_multiple=False, with_data=True)
        )
    )

ft.app(target=main, view=ft.WEB_BROWSER)
