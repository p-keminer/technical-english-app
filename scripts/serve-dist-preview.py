from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1] / "dist"
PORT = 8082


class DistPreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed_path = urlparse(self.path).path
        relative = parsed_path.lstrip("/") or "index.html"
        candidate = ROOT / relative

        if candidate.is_dir():
            candidate = candidate / "index.html"

        if candidate.exists():
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


if __name__ == "__main__":
    if not ROOT.exists():
        raise SystemExit(f"dist directory not found: {ROOT}")

    server = ThreadingHTTPServer(("127.0.0.1", PORT), DistPreviewHandler)
    print(f"Serving dist preview on http://127.0.0.1:{PORT}")
    server.serve_forever()
