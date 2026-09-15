"""
Netra AI Messaging Service
--------------------------
Sends OTP codes via Email or SMS.
Fallback chain:
  Email: Resend API → SendGrid API → SMTP → console (dev mode)
  SMS:   Twilio → Fast2SMS → console (dev mode)
"""

import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Literal

# ─── Email Templates ──────────────────────────────────────────────────────────

def _email_html(otp: str, purpose: str, name: str = "User") -> str:
    action_label = "Verify & Create Account" if purpose == "registration" else "Reset My Password"
    title = "Verify your email" if purpose == "registration" else "Reset your password"
    body_text = (
        f"You requested to create a new Netra AI account."
        if purpose == "registration"
        else f"You requested to reset your Netra AI password."
    )
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🔬 Netra AI</h1>
            <p style="color:#d1fae5;margin:6px 0 0;font-size:14px;">AI-Powered Eye Care Platform</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1f2937;margin:0 0 12px;font-size:20px;">{title}</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">Hi {name},<br>{body_text}</p>
            <p style="color:#6b7280;font-size:15px;margin-top:24px;">Your 6-digit verification code is:</p>
            <div style="margin:24px 0;text-align:center;">
              <span style="display:inline-block;background:#f0fdf4;border:2px dashed #10b981;border-radius:10px;padding:16px 32px;font-size:36px;font-weight:900;letter-spacing:10px;color:#065f46;font-family:monospace;">{otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:13px;">⏱️ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;">If you did not request this, you can safely ignore this email.<br>© 2024 Netra AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

def _email_text(otp: str, purpose: str) -> str:
    action = "create your Netra AI account" if purpose == "registration" else "reset your Netra AI password"
    return f"Your Netra AI verification code to {action} is: {otp}\nThis code expires in 5 minutes. Do not share it with anyone."

def _sms_text(otp: str, purpose: str) -> str:
    action = "registration" if purpose == "registration" else "password reset"
    return f"Netra AI: Your {action} OTP is {otp}. Valid for 5 minutes. Do not share."

# ─── Email Senders ────────────────────────────────────────────────────────────

def _send_via_resend(to_email: str, subject: str, html: str, text: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key or not api_key.startswith("re_"):
        return False
    try:
        import urllib.request
        payload = json.dumps({
            "from": f"{os.environ.get('FROM_NAME', 'Netra AI')} <{os.environ.get('FROM_EMAIL', 'noreply@netra.ai')}>",
            "to": [to_email],
            "subject": subject,
            "html": html,
            "text": text,
        }).encode()
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except Exception as e:
        print(f"[Resend] Error: {e}")
        return False

def _send_via_sendgrid(to_email: str, subject: str, html: str, text: str) -> bool:
    api_key = os.environ.get("SENDGRID_API_KEY", "")
    if not api_key or not api_key.startswith("SG."):
        return False
    try:
        import urllib.request
        from_email = os.environ.get("FROM_EMAIL", "noreply@netra.ai")
        from_name = os.environ.get("FROM_NAME", "Netra AI")
        payload = json.dumps({
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email, "name": from_name},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text},
                {"type": "text/html", "value": html},
            ]
        }).encode()
        req = urllib.request.Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 202
    except Exception as e:
        print(f"[SendGrid] Error: {e}")
        return False

def _send_via_smtp(to_email: str, subject: str, html: str, text: str) -> bool:
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    from_email = os.environ.get("FROM_EMAIL", user)
    from_name = os.environ.get("FROM_NAME", "Netra AI")
    if not host or not user or not password:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[SMTP] Error: {e}")
        return False

# ─── SMS Senders ──────────────────────────────────────────────────────────────

def _send_via_twilio(to_phone: str, message: str) -> bool:
    sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER", "")
    if not sid or not token or not from_number:
        return False
    try:
        import urllib.request
        import urllib.parse
        import base64
        credentials = base64.b64encode(f"{sid}:{token}".encode()).decode()
        payload = urllib.parse.urlencode({"From": from_number, "To": to_phone, "Body": message}).encode()
        req = urllib.request.Request(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
            data=payload,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 201
    except Exception as e:
        print(f"[Twilio] Error: {e}")
        return False

def _send_via_fast2sms(to_phone: str, message: str) -> bool:
    api_key = os.environ.get("FAST2SMS_API_KEY", "")
    if not api_key:
        return False
    try:
        import urllib.request
        digits_only = "".join(filter(str.isdigit, to_phone))[-10:]  # last 10 digits
        payload = json.dumps({
            "route": "q",
            "numbers": digits_only,
            "message": message,
            "flash": 0,
        }).encode()
        req = urllib.request.Request(
            "https://www.fast2sms.com/dev/bulkV2",
            data=payload,
            headers={"authorization": api_key, "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("return", False)
    except Exception as e:
        print(f"[Fast2SMS] Error: {e}")
        return False

# ─── Public API ───────────────────────────────────────────────────────────────

def send_otp_email(to_email: str, otp: str, purpose: str, name: str = "User") -> dict:
    """
    Send OTP via email. Tries Resend → SendGrid → SMTP → dev console.
    Returns dict with keys: sent (bool), provider (str), dev_otp (str | None).
    """
    subject_map = {
        "registration": "Netra AI – Verify your email address",
        "forgot_password": "Netra AI – Reset your password",
    }
    subject = subject_map.get(purpose, "Netra AI – Verification Code")
    html = _email_html(otp, purpose, name)
    text = _email_text(otp, purpose)

    for provider, fn in [
        ("resend", lambda: _send_via_resend(to_email, subject, html, text)),
        ("sendgrid", lambda: _send_via_sendgrid(to_email, subject, html, text)),
        ("smtp", lambda: _send_via_smtp(to_email, subject, html, text)),
    ]:
        try:
            if fn():
                print(f"[Messaging] OTP sent via {provider} to {to_email}")
                return {"sent": True, "provider": provider, "dev_otp": None}
        except Exception:
            pass

    # Dev-mode fallback
    print(f"\n{'='*50}")
    print(f"[DEV MODE] OTP for {to_email} | purpose={purpose}")
    print(f"  OTP CODE: {otp}")
    print(f"{'='*50}\n")
    return {"sent": False, "provider": "console", "dev_otp": otp}

def send_otp_sms(to_phone: str, otp: str, purpose: str) -> dict:
    """
    Send OTP via SMS. Tries Twilio → Fast2SMS → dev console.
    Returns dict with keys: sent (bool), provider (str), dev_otp (str | None).
    """
    message = _sms_text(otp, purpose)

    for provider, fn in [
        ("twilio", lambda: _send_via_twilio(to_phone, message)),
        ("fast2sms", lambda: _send_via_fast2sms(to_phone, message)),
    ]:
        try:
            if fn():
                print(f"[Messaging] OTP sent via {provider} to {to_phone}")
                return {"sent": True, "provider": provider, "dev_otp": None}
        except Exception:
            pass

    # Dev-mode fallback
    print(f"\n{'='*50}")
    print(f"[DEV MODE] OTP for {to_phone} | purpose={purpose}")
    print(f"  OTP CODE: {otp}")
    print(f"{'='*50}\n")
    return {"sent": False, "provider": "console", "dev_otp": otp}

def send_otp(
    destination: str,
    destination_type: Literal["email", "phone"],
    otp: str,
    purpose: str,
    name: str = "User"
) -> dict:
    """Unified OTP dispatcher. Delegates to email or SMS depending on destination_type."""
    if destination_type == "email":
        return send_otp_email(destination, otp, purpose, name)
    else:
        return send_otp_sms(destination, otp, purpose)
