# -*- coding: utf-8 -*-
"""
Auth yardımcıları
Şifre hashleme ve token üretim/doğrulama.
"""

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from config import AUTH_SECRET_KEY, AUTH_TOKEN_EXPIRES_MINUTES


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def sifre_hashle(sifre: str) -> str:
    """PBKDF2-HMAC ile şifre hashler."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        sifre.encode("utf-8"),
        salt.encode("utf-8"),
        120000,
    ).hex()
    return f"{salt}${digest}"


def sifre_dogrula(sifre: str, hashed: str) -> bool:
    """Saklanan hash ile düz şifreyi doğrular."""
    try:
        salt, digest = hashed.split("$", 1)
    except ValueError:
        return False

    calculated = hashlib.pbkdf2_hmac(
        "sha256",
        sifre.encode("utf-8"),
        salt.encode("utf-8"),
        120000,
    ).hex()
    return hmac.compare_digest(calculated, digest)


def access_token_uret(user_id: int, email: str) -> str:
    """
    JWT-benzeri HS256 imzalı access token üretir.
    Dış bağımlılık olmadan çalışır.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=AUTH_TOKEN_EXPIRES_MINUTES)).timestamp()),
    }

    header_part = _b64url_encode(
        json.dumps(header, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    payload_part = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    signature = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    signature_part = _b64url_encode(signature)
    return f"{header_part}.{payload_part}.{signature_part}"


def access_token_dogrula(token: str) -> dict | None:
    """Access token doğrular, payload döner. Geçersizse None."""
    try:
        header_part, payload_part, signature_part = token.split(".")
    except ValueError:
        return None

    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    expected_sig = hmac.new(
        AUTH_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    provided_sig = _b64url_decode(signature_part)

    if not hmac.compare_digest(expected_sig, provided_sig):
        return None

    try:
        payload = json.loads(_b64url_decode(payload_part).decode("utf-8"))
    except Exception:
        return None

    exp = payload.get("exp")
    if not isinstance(exp, int):
        return None

    if int(datetime.now(timezone.utc).timestamp()) >= exp:
        return None

    return payload
