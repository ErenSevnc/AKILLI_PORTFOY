# -*- coding: utf-8 -*-
"""
Para Birimi Route'ları
/api/para-birimleri, /api/doviz-kurlari, /api/donustur endpoint'leri
"""

from fastapi import APIRouter, HTTPException, Query
from services.currency_service import (
    guncel_kurlar_getir,
    parabirimi_donustur,
    formatlama_bilgisi_getir,
    SUPPORTED_CURRENCIES,
    CURRENCY_SYMBOLS,
)

router = APIRouter()


@router.get("/api/para-birimleri")
def para_birimleri_listele():
    """
    Desteklenen tüm para birimlerini döndürür.
    Frontend'deki dropdown için kullanılır.
    """
    return {
        "desteklenen": SUPPORTED_CURRENCIES,
        "semboller": CURRENCY_SYMBOLS,
        "detaylar": [
            formatlama_bilgisi_getir("TRY"),
            formatlama_bilgisi_getir("USD"),
            formatlama_bilgisi_getir("EUR"),
        ],
    }


@router.get("/api/doviz-kurlari")
def doviz_kurlari():
    """
    Güncel döviz kurlarını döndürür.
    Örnek: {"USDTRY": 34.50, "EURTRY": 37.20}
    """
    kurlar = guncel_kurlar_getir()
    
    if not kurlar:
        raise HTTPException(status_code=500, detail="Döviz kurları alınamadı!")
    
    return kurlar


@router.get("/api/donustur")
def tutar_donustur(
    tutar: float = Query(..., description="Dönüştürülecek tutar"),
    kaynak: str = Query(..., description="Kaynak para birimi (TRY, USD, EUR)"),
    hedef: str = Query(..., description="Hedef para birimi (TRY, USD, EUR)"),
):
    """
    Para birimi dönüştürme.
    Örnek: /api/donustur?tutar=100&kaynak=TRY&hedef=USD
    """
    kaynak = kaynak.upper()
    hedef = hedef.upper()
    
    if kaynak not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz kaynak para birimi: {kaynak}")
    
    if hedef not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Geçersiz hedef para birimi: {hedef}")
    
    sonuc = parabirimi_donustur(tutar, kaynak, hedef)
    
    return {
        "tutar": tutar,
        "kaynak": kaynak,
        "hedef": hedef,
        "sonuc": sonuc,
        "kaynak_sembol": CURRENCY_SYMBOLS[kaynak],
        "hedef_sembol": CURRENCY_SYMBOLS[hedef],
    }