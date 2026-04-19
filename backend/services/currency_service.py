# -*- coding: utf-8 -*-
"""
Para Birimi Servis Katmanı
Döviz kurlarını yönetir ve para birimi dönüşümleri yapar.
"""

import yfinance as yf
from typing import Dict


# Para birimi sembolleri
CURRENCY_SYMBOLS = {
    "TRY": "₺",
    "USD": "$",
    "EUR": "€",
}

# Desteklenen para birimleri
SUPPORTED_CURRENCIES = ["TRY", "USD", "EUR"]


def guncel_kurlar_getir() -> Dict[str, float]:
    """
    Güncel döviz kurlarını çeker.
    TRY base alarak USD ve EUR kurlarını döndürür.
    Dönüş: {"USDTRY": 34.50, "EURTRY": 37.20}
    """
    kurlar = {}
    
    try:
        # USD/TRY
        usd_data = yf.Ticker("USDTRY=X").history(period="1d")
        if not usd_data.empty:
            kurlar["USDTRY"] = round(usd_data["Close"].iloc[-1], 2)
        else:
            kurlar["USDTRY"] = 34.50  # Fallback
            
    except Exception as e:
        print(f"USD/TRY kuru alınamadı: {e}")
        kurlar["USDTRY"] = 34.50
    
    try:
        # EUR/TRY
        eur_data = yf.Ticker("EURTRY=X").history(period="1d")
        if not eur_data.empty:
            kurlar["EURTRY"] = round(eur_data["Close"].iloc[-1], 2)
        else:
            kurlar["EURTRY"] = 37.20  # Fallback
            
    except Exception as e:
        print(f"EUR/TRY kuru alınamadı: {e}")
        kurlar["EURTRY"] = 37.20
    
    return kurlar


def parabirimi_donustur(tutar: float, kaynak: str, hedef: str) -> float:
    """
    Bir tutarı bir para biriminden diğerine çevirir.
    
    Örnek: 
    - parabirimi_donustur(100, "TRY", "USD") -> 2.90 (100 TL = 2.90 USD)
    - parabirimi_donustur(50, "USD", "TRY") -> 1725 (50 USD = 1725 TL)
    """
    if kaynak == hedef:
        return tutar
    
    kurlar = guncel_kurlar_getir()
    
    # TRY -> Diğer
    if kaynak == "TRY":
        if hedef == "USD":
            return round(tutar / kurlar["USDTRY"], 2)
        elif hedef == "EUR":
            return round(tutar / kurlar["EURTRY"], 2)
    
    # USD -> Diğer
    elif kaynak == "USD":
        if hedef == "TRY":
            return round(tutar * kurlar["USDTRY"], 2)
        elif hedef == "EUR":
            # USD -> TRY -> EUR
            try_tutar = tutar * kurlar["USDTRY"]
            return round(try_tutar / kurlar["EURTRY"], 2)
    
    # EUR -> Diğer
    elif kaynak == "EUR":
        if hedef == "TRY":
            return round(tutar * kurlar["EURTRY"], 2)
        elif hedef == "USD":
            # EUR -> TRY -> USD
            try_tutar = tutar * kurlar["EURTRY"]
            return round(try_tutar / kurlar["USDTRY"], 2)
    
    return tutar


def sembol_parabirimi_bul(sembol: str) -> str:
    """
    Hisse sembolüne göre para birimini tahmin eder.
    BIST hisseleri -> TRY
    Kripto -> USD
    ABD hisseleri -> USD
    """
    sembol = sembol.upper().strip()
    
    # BIST hisseleri ve endeksi
    if sembol.endswith(".IS") or "XU100" in sembol:
        return "TRY"
    
    # Kripto
    if "-USD" in sembol or "BTC" in sembol or "ETH" in sembol:
        return "USD"
    
    # Döviz çiftleri
    if "TRY=X" in sembol:
        return "TRY"
    
    # Emtia (Altın, Gümüş, Petrol)
    if sembol in ["GC=F", "SI=F", "CL=F"]:
        return "USD"
    
    # ABD hisseleri (varsayılan)
    return "USD"


def formatlama_bilgisi_getir(parabirimi: str) -> Dict[str, str]:
    """
    Para birimi formatı bilgilerini döndürür.
    Dönüş: {"sembol": "₺", "kod": "TRY", "isim": "Türk Lirası"}
    """
    formatlar = {
        "TRY": {"sembol": "₺", "kod": "TRY", "isim": "Türk Lirası"},
        "USD": {"sembol": "$", "kod": "USD", "isim": "Amerikan Doları"},
        "EUR": {"sembol": "€", "kod": "EUR", "isim": "Euro"},
    }
    
    return formatlar.get(parabirimi, formatlar["TRY"])