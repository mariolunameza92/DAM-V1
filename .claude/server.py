import os, sys
os.chdir('/Users/lenadmin/Documents/GitHub/DAM-V1')
from http.server import HTTPServer, SimpleHTTPRequestHandler
httpd = HTTPServer(('', 3000), SimpleHTTPRequestHandler)
print('Serving on http://localhost:3000', flush=True)
httpd.serve_forever()
