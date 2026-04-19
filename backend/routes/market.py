# -*- coding: utf-8 -*-
"""
Piyasa Route'ları
/api/piyasa ve /api/hisse/{sembol} endpoint'leri
"""

from fastapi import APIRouter, HTTPException
from services.market_service import piyasa_ozeti_getir, hisse_detay_getir

router = APIRouter()


@router.get("/api/piyasa")
def piyasa_ozeti():
    """Ana sayfadaki canlı piyasa kartı verileri"""
    return piyasa_ozeti_getir()


@router.get("/api/hisse/{sembol}")
def hisse_detay(sembol: str):
    """Tek bir hissenin güncel detayları"""
    sonuc = hisse_detay_getir(sembol)

    if "hata" in sonuc:
        raise HTTPException(status_code=404, detail=sonuc["hata"])

    return sonuc