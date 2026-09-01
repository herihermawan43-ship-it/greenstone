import os
import base64
import hashlib
import logging
from dotenv import load_dotenv
from cryptography.fernet import Fernet, InvalidToken

load_dotenv()
logger = logging.getLogger(__name__)

JWT_SECRET = os.environ["JWT_SECRET"]

SENSITIVE_FIELDS = {"openai_api_key", "anthropic_api_key", "gemini_api_key", "smtp_password"}

# field -> fallback env var name
ENV_FALLBACK = {
    "openai_api_key": "OPENAI_API_KEY",
    "anthropic_api_key": "ANTHROPIC_API_KEY",
    "gemini_api_key": "GEMINI_API_KEY",
    "autoblog_openai_model": "AUTOBLOG_OPENAI_MODEL",
    "autoblog_anthropic_model": "AUTOBLOG_ANTHROPIC_MODEL",
    "autoblog_gemini_model": "AUTOBLOG_GEMINI_MODEL",
    "smtp_host": "SMTP_HOST",
    "smtp_port": "SMTP_PORT",
    "smtp_user": "SMTP_USER",
    "smtp_password": "SMTP_PASSWORD",
    "email_from_address": "EMAIL_FROM_ADDRESS",
    "email_from_name": "EMAIL_FROM_NAME",
    "email_reply_to": "EMAIL_REPLY_TO",
    "owner_email": "OWNER_EMAIL",
}

MODEL_DEFAULTS = {
    "autoblog_openai_model": "gpt-4o",
    "autoblog_anthropic_model": "claude-sonnet-5",
    "autoblog_gemini_model": "gemini-2.0-flash",
}


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(JWT_SECRET.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt(value: str) -> str:
    if not value:
        return ""
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def _decrypt(value: str) -> str:
    if not value:
        return ""
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        logger.error("Failed to decrypt a stored integration setting; ignoring it")
        return ""


async def get_settings(db) -> dict:
    """Decrypted settings merged with env var fallback. Used by autoblog/email_service."""
    doc = await db.settings.find_one({"key": "integrations"}, {"_id": 0}) or {}
    out = {}
    for field, env_name in ENV_FALLBACK.items():
        v = doc.get(field)
        if field in SENSITIVE_FIELDS:
            v = _decrypt(v) if v else None
        if not v:
            env_v = os.environ.get(env_name)
            v = env_v if env_v else None
        if not v and field in MODEL_DEFAULTS:
            v = MODEL_DEFAULTS[field]
        out[field] = v

    out["smtp_port"] = int(out["smtp_port"]) if out.get("smtp_port") else 587

    tls_raw = doc.get("smtp_use_tls")
    if tls_raw is None:
        env_tls = os.environ.get("SMTP_USE_TLS")
        tls_raw = (env_tls.lower() != "false") if env_tls is not None else True
    out["smtp_use_tls"] = bool(tls_raw)

    return out


async def get_display_settings(db) -> dict:
    """Masked settings for the admin UI — never exposes full secret values."""
    doc = await db.settings.find_one({"key": "integrations"}, {"_id": 0}) or {}
    resolved = await get_settings(db)

    out = {}
    for field in ENV_FALLBACK:
        if field in SENSITIVE_FIELDS:
            value = resolved.get(field) or ""
            out[f"{field}_set"] = bool(value)
            out[f"{field}_hint"] = f"••••{value[-4:]}" if len(value) >= 4 else ("••••" if value else "")
            out[f"{field}_source"] = "database" if doc.get(field) else ("env" if value else "none")
        else:
            out[field] = resolved.get(field) or ""

    out["smtp_port"] = resolved["smtp_port"]
    out["smtp_use_tls"] = resolved["smtp_use_tls"]
    return out


async def save_settings(db, updates: dict) -> None:
    """updates: dict of field -> new value. Empty string on a sensitive field means
    'keep the existing stored value' (the admin UI never round-trips real secrets)."""
    set_ops = {}
    for field, value in updates.items():
        if field not in ENV_FALLBACK and field != "smtp_use_tls":
            continue
        if value is None:
            continue
        if field in SENSITIVE_FIELDS:
            if value == "":
                continue
            set_ops[field] = _encrypt(value)
        else:
            set_ops[field] = value
    if set_ops:
        await db.settings.update_one({"key": "integrations"}, {"$set": set_ops}, upsert=True)
