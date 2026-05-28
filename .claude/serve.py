import http.server
import os
import sys

os.chdir('/Users/lenadmin/Documents/GitHub/DAM-V1')
port = int(os.environ.get('PORT', 3000))
handler = http.server.SimpleHTTPRequestHandler
with http.server.HTTPServer(('', port), handler) as httpd:
    httpd.serve_forever()
