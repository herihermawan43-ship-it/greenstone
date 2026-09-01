import re
import ipaddress
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from dotenv import load_dotenv
import aiosmtplib

from settings_service import get_settings

load_dotenv()
logger = logging.getLogger(__name__)

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(db, *, to: str, subject: str, html: str) -> None:
    _assert_safe_email(subject, html)
    settings = await get_settings(db)
    if not settings.get("smtp_host") or not settings.get("smtp_user") or not settings.get("smtp_password"):
        raise RuntimeError("SMTP is not configured (set it in Admin > Settings or via .env)")

    from_address = settings.get("email_from_address") or settings["smtp_user"]
    from_name = settings.get("email_from_name") or "Website"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_address}>"
    msg["To"] = to
    if settings.get("email_reply_to"):
        msg["Reply-To"] = settings["email_reply_to"]
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings["smtp_host"],
        port=settings["smtp_port"],
        username=settings["smtp_user"],
        password=settings["smtp_password"],
        start_tls=settings["smtp_use_tls"],
    )


def _row(label: str, value: str) -> str:
    return (f'<tr><td style="padding:8px 12px;font-size:12px;color:#6b7264;text-transform:uppercase;'
            f'letter-spacing:1px;white-space:nowrap;vertical-align:top">{escape(label)}</td>'
            f'<td style="padding:8px 12px;font-size:14px;color:#1c211b">{escape(value) or "—"}</td></tr>')


async def notify_new_inquiry(db, doc: dict) -> None:
    try:
        settings = await get_settings(db)
        owner_email = settings.get("owner_email")
        from_name = settings.get("email_from_name") or "Website"
        if not owner_email:
            logger.warning("Inquiry notification skipped: no owner_email configured")
            return

        subject = f"New website inquiry from {doc.get('name', 'a visitor')}"
        rows = "".join([
            _row("Name", doc.get("name", "")),
            _row("Email", doc.get("email", "")),
            _row("Company", doc.get("company", "")),
            _row("Country", doc.get("country", "")),
            _row("Product", doc.get("product", "")),
            _row("Message", doc.get("message", "")),
            _row("Received", doc.get("created_at", "")),
        ])
        html = (
            '<table role="presentation" width="100%" style="background:#f4f4f1;padding:24px 0">'
            '<tr><td align="center">'
            '<table role="presentation" width="560" style="background:#ffffff;border:1px solid #e3e3dd;'
            'font-family:Arial,sans-serif">'
            '<tr><td style="background:#101510;padding:20px 24px">'
            f'<span style="color:#c9a86a;font-size:11px;letter-spacing:3px;text-transform:uppercase">'
            f'{escape(from_name)}</span><br>'
            '<span style="color:#f2f1ec;font-size:20px;font-weight:bold">New Inquiry Received</span>'
            '</td></tr>'
            '<tr><td style="padding:16px 12px"><table role="presentation" width="100%">'
            f'{rows}</table></td></tr>'
            '<tr><td style="padding:16px 24px;border-top:1px solid #e3e3dd">'
            '<p style="font-size:13px;color:#4a4f45;margin:0">Open your admin dashboard '
            '(Admin &rsaquo; Inquiries) to view and manage this inquiry.</p>'
            f'<p style="font-size:11px;color:#9a9a92;margin:12px 0 0">Sent by {escape(from_name)} '
            'website. We never ask for passwords or payment details by email.</p>'
            '</td></tr></table></td></tr></table>'
        )
        await send_email(db, to=owner_email, subject=subject, html=html)
        logger.info("Inquiry notification email sent to %s", owner_email)
    except Exception as e:
        logger.error("Inquiry notification email failed: %s", e)
