import http.server
import smtplib
import os
import sys
import json
from email.mime.text import MIMEText

class NotifyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            payload = json.loads(post_data)
            message = payload.get("message", "Registration successful!")
            smtp_config = payload.get("smtp", {})
        except Exception:
            self.send_error_response("Invalid JSON payload")
            return

        print(f"\n[ViBoot Alert] {message}")
        
        try:
            import winsound
            winsound.Beep(1200, 1500)
            os.system('PowerShell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(\'Gym slot registered successfully!\')"')
        except Exception as e:
            print("Audio alert failed:", e)

        if smtp_config.get("enable"):
            try:
                server_host = smtp_config.get("server", "smtp.gmail.com")
                server_port = int(smtp_config.get("port", 587))
                sender = smtp_config.get("sender", "")
                password = smtp_config.get("password", "")
                receiver = smtp_config.get("receiver", "")

                if not sender or not password or not receiver:
                    print("SMTP Alert: Missing credentials")
                else:
                    msg = MIMEText(message)
                    msg['Subject'] = 'ViBoot: Gym Slot Registered Successfully!'
                    msg['From'] = sender
                    msg['To'] = receiver
                    
                    if server_port == 465:
                        with smtplib.SMTP_SSL(server_host, server_port) as server:
                            server.login(sender, password)
                            server.sendmail(sender, [receiver], msg.as_string())
                    else:
                        with smtplib.SMTP(server_host, server_port) as server:
                            server.starttls() # Gmail mandates this to succeed
                            server.login(sender, password)
                            server.sendmail(sender, [receiver], msg.as_string())
                    print("Notification email sent successfully!")
            except Exception as e:
                print("SMTP email alert failed:", e)
                
        self.send_success_response()

    def send_success_response(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"OK")

    def send_error_response(self, msg):
        self.send_response(400)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(msg.encode())

def run(port=3000):
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, NotifyHandler)
    print("=" * 60)
    print(f"ViBoot Local Notification Server running on port {port}...")
    print("Keep this terminal window open to receive alerts.")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)

if __name__ == '__main__':
    run()
