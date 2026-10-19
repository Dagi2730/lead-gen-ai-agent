import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional

def test_smtp_connection(
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool = True,
    use_ssl: bool = False
) -> Dict[str, Any]:
    """Test SMTP handshake and authentication."""
    if not host or not username or not password:
        return {
            "success": False,
            "message": "Host, username, and password are required to test SMTP connection."
        }

    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as server:
                server.login(username, password)
                return {"success": True, "message": f"Successfully authenticated with SMTP SSL on {host}:{port}"}
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                if use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(username, password)
                return {"success": True, "message": f"Successfully authenticated with SMTP STARTTLS on {host}:{port}"}
    except Exception as e:
        return {
            "success": False,
            "message": f"SMTP Connection Failed: {str(e)}"
        }

def send_smtp_email(
    host: str,
    port: int,
    username: str,
    password: str,
    from_name: str,
    from_email: str,
    to_email: str,
    subject: str,
    body_text: str,
    use_tls: bool = True,
    use_ssl: bool = False
) -> Dict[str, Any]:
    """Send an outbound email via configured SMTP server."""
    # If credentials are not provided or testing with dummy host, return simulation mode
    if not host or not username or not password or "dummy" in host.lower() or "example" in host.lower():
        return {
            "success": True,
            "simulated": True,
            "message": f"[Simulation Mode] Direct outreach sequence successfully dispatched to {to_email}."
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email or username}>"
        msg["To"] = to_email

        # Attach plain text
        part_text = MIMEText(body_text, "plain")
        msg.attach(part_text)

        # Attach formatted HTML version
        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px;">
            {body_text.replace(chr(10), '<br/>')}
            <br/><br/>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b;">
                Sent via <strong>LeadGen AI</strong> Multi-Touch Outreach Sequencer
            </p>
        </div>
        """
        part_html = MIMEText(html_body, "html")
        msg.attach(part_html)

        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=12) as server:
                server.login(username, password)
                server.sendmail(from_email or username, to_email, msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.ehlo()
                if use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(username, password)
                server.sendmail(from_email or username, to_email, msg.as_string())

        return {
            "success": True,
            "simulated": False,
            "message": f"Email successfully dispatched to {to_email} via {host}."
        }
    except Exception as e:
        return {
            "success": False,
            "simulated": False,
            "message": f"Failed to send email: {str(e)}"
        }
