import asyncio
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("campusmind.email")

class EmailService:
    def __init__(self):
        pass

    def _build_html_template(self, name: str, otp: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your CampusMind Account</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090d16;
      margin: 0;
      padding: 30px 15px;
      color: #e2e8f0;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%);
      padding: 32px 24px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }}
    .header p {{
      margin: 6px 0 0 0;
      color: #e0e7ff;
      font-size: 13px;
    }}
    .content {{
      padding: 32px 28px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }}
    .message {{
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }}
    .otp-card {{
      background: #1e293b;
      border: 1px dashed #6366f1;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }}
    .otp-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #818cf8;
      margin-bottom: 8px;
    }}
    .otp-code {{
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #ffffff;
      font-family: monospace;
    }}
    .expiry {{
      font-size: 12px;
      color: #f59e0b;
      margin-top: 8px;
      font-weight: 500;
    }}
    .footer {{
      border-top: 1px solid #1e293b;
      padding: 20px 28px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 CampusMind</h1>
      <p>Official College Document Intelligence Platform</p>
    </div>
    <div class="content">
      <div class="greeting">Hello {name},</div>
      <div class="message">
        Welcome to CampusMind! To complete your registration and verify your institutional account, please enter the one-time verification code below:
      </div>
      <div class="otp-card">
        <div class="otp-label">Verification Code</div>
        <div class="otp-code">{otp}</div>
        <div class="expiry">⏱️ Valid for {settings.OTP_EXPIRE_MINUTES} minutes</div>
      </div>
      <div class="message" style="font-size: 12px; margin-bottom: 0;">
        If you did not request this account registration, you can safely disregard this email.
      </div>
    </div>
    <div class="footer">
      &copy; CampusMind AI Platform &bull; Built for College Document Intelligence
    </div>
  </div>
</body>
</html>"""

    def _send_via_smtp_sync(self, recipient_email: str, recipient_name: str, otp: str):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your CampusMind Verification Code: {otp}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = recipient_email

        plain_text = (
            f"Hello {recipient_name},\n\n"
            f"Your CampusMind verification code is: {otp}\n\n"
            f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            f"If you did not request this, please ignore this message.\n\n"
            f"— CampusMind Team"
        )
        html_content = self._build_html_template(recipient_name, otp)

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [recipient_email], msg.as_string())

    async def send_verification_otp(self, recipient_email: str, recipient_name: str, otp: str) -> bool:
        """
        Sends OTP to recipient. If SMTP is configured, sends via SMTP.
        Otherwise falls back to high-visibility console log for local development.
        """
        has_smtp = bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

        if has_smtp:
            try:
                await asyncio.to_thread(self._send_via_smtp_sync, recipient_email, recipient_name, otp)
                logger.info(f"Verification email successfully sent via SMTP to {recipient_email}")
                return True
            except Exception as e:
                logger.warning(f"SMTP delivery failed ({e}). Falling back to terminal output.")

        # Development / Fallback Console Output
        dev_banner = (
            "\n"
            + "=" * 68 + "\n"
            + "[CAMPUSMIND EMAIL VERIFICATION - DEV MODE]\n"
            + f"Recipient : {recipient_name} <{recipient_email}>\n"
            + f"OTP Code  : [  {otp}  ]\n"
            + f"Expires In: {settings.OTP_EXPIRE_MINUTES} minutes\n"
            + "=" * 68 + "\n"
        )
        try:
            print(dev_banner, flush=True)
        except Exception:
            pass
        logger.info(f"[DEV MODE OTP] Recipient: {recipient_email} | Code: {otp}")
        return True

email_service = EmailService()
