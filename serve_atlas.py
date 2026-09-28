import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8765
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class AtlasHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    server = HTTPServer(('127.0.0.1', PORT), AtlasHandler)
    print(f"Serving Atlas on http://127.0.0.1:{PORT}/ from {DIRECTORY}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    main()
