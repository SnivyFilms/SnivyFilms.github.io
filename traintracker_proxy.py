#!/usr/bin/env python3
import http.server
import os
import socketserver
import urllib.parse
import urllib.request

ALLOWED_HOSTS = {
    "api.septa.org",
    "gtfs.vre.org",
    "asm-backend.transitdocs.com",
    "api-v3.mbta.com",
    "backend-unified.mylirr.org",
    "luxapi.verbinteractive.com",
    "trirailpublic.etaspot.net"
}


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/proxy":
            return super().do_GET()

        query = urllib.parse.parse_qs(parsed.query)
        target = query.get("url", [""])[0]
        if not target:
            self.send_error(400, "Missing url parameter")
            return

        target_parsed = urllib.parse.urlparse(target)
        if target_parsed.scheme not in ("http", "https"):
            self.send_error(400, "Invalid url scheme")
            return

        if target_parsed.hostname not in ALLOWED_HOSTS:
            self.send_error(403, "Host not allowed")
            return

        try:
            request = urllib.request.Request(
                target,
                headers={
                    "User-Agent": "traintracker-proxy/1.0",
                    "Accept": "*/*"
                }
            )
            with urllib.request.urlopen(request, timeout=15) as response:
                body = response.read()
                self.send_response(response.status)
                content_type = response.headers.get("Content-Type")
                if content_type:
                    self.send_header("Content-Type", content_type)
                self.send_header("Cache-Control", "no-store")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
        except Exception as exc:
            self.send_error(502, f"Proxy error: {exc}")


def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(os.environ.get("PORT", "8000"))
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), ProxyHandler) as httpd:
        print(f"Train Tracker proxy running at http://localhost:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    run()
