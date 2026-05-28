import http.server, socketserver

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory='/Users/lenadmin/Documents/GitHub/DAM-V1', **k)
    def log_message(self, *a):
        pass

with socketserver.TCPServer(('', 3000), H) as s:
    s.serve_forever()
