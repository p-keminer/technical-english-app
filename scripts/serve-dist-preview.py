from __future__ import annotations

import argparse
import mimetypes
import socket
import ssl
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1] / "dist"
CERT_ROOT = Path(__file__).resolve().parents[1] / ".local-https"
DEFAULT_PORT = 8443
DEFAULT_CERT_DOWNLOAD_PORT = 8091

mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("application/x-x509-ca-cert", ".cer")
SimpleHTTPRequestHandler.extensions_map[".webmanifest"] = "application/manifest+json"
SimpleHTTPRequestHandler.extensions_map[".wasm"] = "application/wasm"
SimpleHTTPRequestHandler.extensions_map[".cer"] = "application/x-x509-ca-cert"


def get_lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("8.8.8.8", 80))
            return probe.getsockname()[0]
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return "127.0.0.1"


class DistPreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        if self.path.endswith("/sw.js") or self.path == "/sw.js":
            self.send_header("Cache-Control", "no-store")
            self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

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


class CertificateDownloadHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, root_ca_file: Path, **kwargs):
        self.root_ca_file = root_ca_file
        super().__init__(*args, directory=str(root_ca_file.parent), **kwargs)

    def do_GET(self):
        parsed_path = urlparse(self.path).path
        if parsed_path == "/local-root-ca.cer":
            self.path = f"/{self.root_ca_file.name}"
            return super().do_GET()

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            f"""<!doctype html>
<html lang=\"de\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Lokales PWA-Zertifikat</title>
    <style>
      body {{ font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f4e1c1; color: #10223f; }}
      main {{ background: #fffaf2; border: 2px solid #10223f; border-radius: 22px; max-width: 680px; padding: 24px; }}
      a {{ color: #c84c12; font-weight: 800; }}
      li {{ margin-bottom: 10px; }}
    </style>
  </head>
  <body>
    <main>
      <h1>Lokales Zertifikat installieren</h1>
      <p>Installiere dieses Zertifikat einmal auf dem iPhone und aktiviere danach volles Vertrauen.</p>
      <p><a href=\"/local-root-ca.cer\">local-root-ca.cer herunterladen</a></p>
      <ol>
        <li>Link antippen und Profil erlauben.</li>
        <li>iPhone: Einstellungen -> Profil geladen -> Installieren.</li>
        <li>Einstellungen -> Allgemein -> Info -> Zertifikatsvertrauenseinstellungen.</li>
        <li>Volles Vertrauen fuer "Technical English Coach Local Root CA" aktivieren.</li>
      </ol>
    </main>
  </body>
</html>""".encode("utf-8")
        )


def start_certificate_server(root_ca_file: Path, host: str, port: int) -> ThreadingHTTPServer:
    def handler(*args, **kwargs):
        return CertificateDownloadHandler(*args, root_ca_file=root_ca_file, **kwargs)

    server = ThreadingHTTPServer((host, port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serve the offline PWA export from dist/.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--cert-file", default=str(CERT_ROOT / "server.crt"))
    parser.add_argument("--key-file", default=str(CERT_ROOT / "server.key"))
    parser.add_argument("--root-ca-file", default=str(CERT_ROOT / "rootCA.cer"))
    parser.add_argument("--cert-download-port", type=int, default=DEFAULT_CERT_DOWNLOAD_PORT)
    parser.add_argument("--http-only", action="store_true")
    args = parser.parse_args()

    if not ROOT.exists():
        raise SystemExit(f"dist directory not found: {ROOT}")

    server = ThreadingHTTPServer((args.host, args.port), DistPreviewHandler)
    lan_ip = get_lan_ip()
    scheme = "http"

    cert_file = Path(args.cert_file)
    key_file = Path(args.key_file)
    root_ca_file = Path(args.root_ca_file)

    if not args.http_only:
        if not cert_file.exists() or not key_file.exists():
            raise SystemExit(
                f"HTTPS certificate files missing. Run `npm run pwa:cert` first.\nMissing: {cert_file} / {key_file}"
            )

        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=str(cert_file), keyfile=str(key_file))
        server.socket = context.wrap_socket(server.socket, server_side=True)
        scheme = "https"

        if root_ca_file.exists() and args.cert_download_port:
            start_certificate_server(root_ca_file, args.host, args.cert_download_port)
            print(f"Certificate install URL: http://{lan_ip}:{args.cert_download_port}")
            print("After installing, enable full trust on iPhone before opening the HTTPS PWA URL.")

    print(f"Serving dist preview on {scheme}://127.0.0.1:{args.port}")
    print(f"LAN URL for phone preview: {scheme}://{lan_ip}:{args.port}")
    server.serve_forever()
