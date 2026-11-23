"""Локальный сервер для сайта-визитки с отключённым кэшированием.

Запуск:
    python serve.py 8123

Откройте: http://127.0.0.1:8123/
Если порт не указан, используется 8123.
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"[{self.address_string()}] {fmt % args}", flush=True)


if __name__ == "__main__":
    handler = partial(NoCacheHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Сайт доступен: http://127.0.0.1:{PORT}/", flush=True)
        print(f"Раздаём папку: {ROOT}", flush=True)
        httpd.serve_forever()
