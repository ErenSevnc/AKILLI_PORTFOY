# -*- coding: utf-8 -*-
"""
Analiz Route'ları
/api/analiz/{sembol}/{periyot} ve /api/optimizasyon-dogrulama/{sembol}/{tip} endpoint'leri
"""

from fastapi import APIRouter, HTTPException, Query
from services.analysis_service import hisse_analiz, optimizasyon_dogrulama

router = APIRouter()


@router.get("/api/analiz/{sembol}/{periyot}")
def analiz(sembol: str, periyot: str, toplam_ay: int = Query(None), test_ay: int = Query(None)):
    """
    Hissenin grafik, RSI/MA analiz ve backtest sonuçlarını döndürür.
    periyot: '1H', '1A', '3A', '1Y'
    toplam_ay: Toplam eğitim ayı sayısı (opsiyonel)
    test_ay: Test ayı sayısı (opsiyonel)
    """
    sonuc = hisse_analiz(sembol, periyot, toplam_ay, test_ay)

    if "hata" in sonuc:
        raise HTTPException(status_code=500, detail=sonuc["hata"])

    return sonuc


@router.get("/api/optimizasyon-dogrulama/{sembol}/{tip}")
def dogrulama(sembol: str, tip: str):
    """
    Tüm periyotların performansını test eder.
    tip: 'rsi' veya 'ma'
    """
    sonuc = optimizasyon_dogrulama(sembol, tip)

    if "hata" in sonuc:
        raise HTTPException(status_code=500, detail=sonuc["hata"])

    return sonuc