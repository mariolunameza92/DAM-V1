import http.server, os, sys
os.chdir('/Users/lenadmin/Documents/GitHub/DAM-V1')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=port, bind='127.0.0.1')
