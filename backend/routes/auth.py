# -*- coding: utf-8 -*-
"""
Auth Route'ları
/api/auth/register, /api/auth/login, /api/auth/me
"""

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import GirisIstek, KayitIstek
from services.auth_service import aktif_kullanici, giris_yap, kayit_ol

router = APIRouter()


@router.post("/api/auth/register")
def register(payload: KayitIstek):
    sonuc = kayit_ol(payload.email, payload.kullanici_adi, payload.sifre)
    if "hata" in sonuc:
        raise HTTPException(status_code=400, detail=sonuc["hata"])
    return sonuc


@router.post("/api/auth/login")
def login(payload: GirisIstek):
    sonuc = giris_yap(payload.email, payload.sifre)
    if "hata" in sonuc:
        raise HTTPException(status_code=401, detail=sonuc["hata"])
    return sonuc


@router.get("/api/auth/me")
def me(kullanici=Depends(aktif_kullanici)):
    return {"kullanici": kullanici}
