# -*- coding: utf-8 -*-
"""
Sembol Route'ları
/api/sembol-ara ve /api/guncel-fiyat/{sembol} endpoint'leri
"""

from fastapi import APIRouter, HTTPException, Query
from services.symbol_service import sembol_ara, guncel_fiyat_getir

router = APIRouter()


@router.get("/api/sembol-ara")
def sembol_arama(
    q: str = Query("", description="Arama metni"),
    limit: int = Query(20, ge=1, le=50, description="Maksimum sonuç adedi"),
):
    """
    Sembol arama - Autocomplete için.
    Örnek: /api/sembol-ara?q=ase
    """
    return sembol_ara(q, limit)


@router.get("/api/guncel-fiyat/{sembol}")
def guncel_fiyat(sembol: str):
    """
    Belirtilen sembolün güncel fiyatını getir.
    Örnek: /api/guncel-fiyat/THYAO
    """
    sonuc = guncel_fiyat_getir(sembol)

    if "hata" in sonuc:
        raise HTTPException(status_code=404, detail=sonuc["hata"])

    return sonuc
