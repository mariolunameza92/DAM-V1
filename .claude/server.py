#!/usr/bin/env python3
import http.server, os, sys

os.chdir("/Users/lenadmin/Documents/GitHub/DAM-V1")
handler = http.server.SimpleHTTPRequestHandler
handler.log_message = lambda *a: None
httpd = http.server.HTTPServer(("127.0.0.1", 3000), handler)
print("Serving on http://localhost:3000", flush=True)
httpd.serve_forever()
