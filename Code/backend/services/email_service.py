import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from config import settings

def send_email_notification(to_email: str, subject: str, body_html: str, attachments: list = None) -> bool:
    smtp_user = settings.SMTP_USER.strip() if settings.SMTP_USER else ""
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "").strip() if settings.SMTP_PASSWORD else ""

    if not smtp_user or not smtp_pass:
        print(f"[Email Notification Simulation to {to_email}] Subject: {subject}")
        if attachments:
            print(f"  [Simulated Attachments]: {[a.get('filename') for a in attachments if isinstance(a, dict)]}")
        return True
    
    try:
        msg = MIMEMultipart('mixed')
        msg['From'] = f"AI Job Placement Platform <{settings.FROM_EMAIL or smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # HTML Content container
        msg_alternative = MIMEMultipart('alternative')
        msg_alternative.attach(MIMEText(body_html, 'html', 'utf-8'))
        msg.attach(msg_alternative)
        
        # Handle file attachments (PDFs, text files, documents)
        if attachments:
            for att in attachments:
                if not isinstance(att, dict):
                    continue
                filename = att.get('filename', 'attachment')
                file_bytes = None
                
                if att.get('content'):
                    raw_content = att['content']
                    file_bytes = raw_content.encode('utf-8') if isinstance(raw_content, str) else raw_content
                elif att.get('filepath') and os.path.exists(att['filepath']):
                    try:
                        with open(att['filepath'], 'rb') as f:
                            file_bytes = f.read()
                    except Exception as fe:
                        print(f"Could not read attachment file {att.get('filepath')}: {fe}")
                
                if file_bytes:
                    part = MIMEApplication(file_bytes, Name=filename)
                    part['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(part)

        server = smtplib.SMTP(settings.SMTP_HOST or "smtp.gmail.com", settings.SMTP_PORT or 587, timeout=15)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [to_email], msg.as_string())
        server.quit()
        print(f"Successfully sent email notification to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email notification to {to_email}: {e}")
        return False
