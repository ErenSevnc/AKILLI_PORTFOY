# -*- coding: utf-8 -*-
"""
Portföy Servis Katmanı
Portföy CRUD işlemlerinin iş mantığı burada.
Database ile doğrudan konuşan tek yer burada.
"""

import yfinance as yf
from database import PortfolioManager
from utils.helpers import sembol_duzelt


# Singleton - tek bir PortfolioManager instance
_portfolio_manager = PortfolioManager()


def portfoy_listele(user_id: int) -> list[dict]:
    """
    Kullanıcının portföyünü listeler ve her birinin
    güncel fiyatını yfinance'den çeker.
    """
    hisseler = _portfolio_manager.tum_hisseleri_getir(user_id)

    for hisse in hisseler:
        try:
            kod = sembol_duzelt(hisse["sembol"])
            hist = yf.Ticker(kod).history(period="1d")

            if not hist.empty:
                hisse["guncel"] = round(hist["Close"].iloc[-1], 2)
            else:
                hisse["guncel"] = hisse["maliyet"]

        except Exception as e:
            print(f"Fiyat çekilemedi ({hisse['sembol']}): {e}")
            hisse["guncel"] = hisse["maliyet"]

    return hisseler


def hisse_ekle(user_id: int, sembol: str, adet: float, maliyet: float) -> dict:
    """
    Önce sembolün geçerli olduğunu doğrular, sonra veritabanına ekler.
    Başarılı: {"id": 1, "sembol": "THYAO", ...}
    Başarısız: {"hata": "Geçersiz sembol!"}
    """
    kod = sembol_duzelt(sembol)

    # Sembol gerçekten var mı kontrol
    try:
        hist = yf.Ticker(kod).history(period="1d")
        if hist.empty:
            return {"hata": "Geçersiz sembol!"}
    except Exception:
        return {"hata": "Hisse bulunamadı!"}

    # Veritabanına ekle
    return _portfolio_manager.hisse_ekle(user_id, sembol, adet, maliyet)


def hisse_sil(user_id: int, hisse_id: int) -> dict:
    """
    Portföyden hisse siler.
    Başarılı: {"mesaj": "Silindi!", "silinen_id": 1}
    Başarısız: {"hata": "Hisse bulunamadı!"}
    """
    return _portfolio_manager.hisse_sil(user_id, hisse_id)


def hisse_guncelle(
    user_id: int, hisse_id: int, adet: float = None, maliyet: float = None
) -> dict:
    """
    Portföydeki hisseyi günceller.
    Başarılı: {"mesaj": "Güncellendi!", "id": 1, ...}
    Başarısız: {"hata": "Hisse bulunamadı!"}
    """
    return _portfolio_manager.hisse_guncelle(
        user_id, hisse_id, adet=adet, maliyet=maliyet
    )
