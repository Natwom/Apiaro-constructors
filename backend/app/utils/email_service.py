import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_contact_email(message_data):
    """Send email notification when contact form is submitted"""
    try:
        smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('MAIL_PORT', 587))
        smtp_username = os.getenv('MAIL_USERNAME')
        smtp_password = os.getenv('MAIL_PASSWORD')
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@apiaro.com')
        
        if not smtp_username or not smtp_password:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Contact Message: {message_data.get('subject', 'No Subject')}"
        msg['From'] = smtp_username
        msg['To'] = admin_email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #1e3a8a;">New Contact Message Received</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                <p><strong>Name:</strong> {message_data.get('name')}</p>
                <p><strong>Email:</strong> {message_data.get('email')}</p>
                <p><strong>Phone:</strong> {message_data.get('phone', 'Not provided')}</p>
                <p><strong>Subject:</strong> {message_data.get('subject', 'Not provided')}</p>
                <hr style="margin: 20px 0;">
                <p><strong>Message:</strong></p>
                <p>{message_data.get('message')}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Received at: {message_data.get('created_at')}
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, admin_email, msg.as_string())
        
        print(f"✅ Email notification sent for message from {message_data.get('email')}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False