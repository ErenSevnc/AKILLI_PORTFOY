# -*- coding: utf-8 -*-
"""
Auth servis katmanı
Kullanıcı kayıt/giriş ve token doğrulama iş mantığı.
"""

from fastapi import Header, HTTPException
from psycopg2 import IntegrityError

from database import UserManager
from utils.auth import access_token_dogrula, access_token_uret, sifre_dogrula, sifre_hashle


_user_manager = UserManager()


def kayit_ol(email: str, kullanici_adi: str, sifre: str) -> dict:
    mevcut = _user_manager.email_ile_kullanici_getir(email)
    if mevcut:
        return {"hata": "Bu e-posta zaten kayıtlı"}

    if _user_manager.username_ile_kullanici_getir(kullanici_adi):
        return {"hata": "Bu kullanıcı adı kullanımda"}

    try:
        password_hash = sifre_hashle(sifre)
        kullanici = _user_manager.kullanici_olustur(email, kullanici_adi, password_hash)
    except IntegrityError:
        return {"hata": "Kayıt sırasında çakışma oluştu (e-posta veya kullanıcı adı)"}

    token = access_token_uret(kullanici["id"], kullanici["email"])
    return {
        "token": token,
        "kullanici": {
            "id": kullanici["id"],
            "email": kullanici["email"],
            "username": kullanici["username"],
        },
    }


def giris_yap(email: str, sifre: str) -> dict:
    kullanici = _user_manager.email_ile_kullanici_getir(email)
    if not kullanici:
        return {"hata": "E-posta veya şifre hatalı"}

    if not sifre_dogrula(sifre, kullanici["password_hash"]):
        return {"hata": "E-posta veya şifre hatalı"}

    token = access_token_uret(kullanici["id"], kullanici["email"])
    return {
        "token": token,
        "kullanici": {
            "id": kullanici["id"],
            "email": kullanici["email"],
            "username": kullanici["username"],
        },
    }


def token_ile_kullanici_getir(token: str) -> dict | None:
    payload = access_token_dogrula(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not isinstance(user_id, int):
        return None

    kullanici = _user_manager.id_ile_kullanici_getir(user_id)
    if not kullanici:
        return None

    return {
        "id": kullanici["id"],
        "email": kullanici["email"],
        "username": kullanici["username"],
    }


def aktif_kullanici(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Yetkilendirme gerekli")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Geçersiz token formatı")

    token = parts[1].strip()
    kullanici = token_ile_kullanici_getir(token)

    if not kullanici:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")

    return kullanici
