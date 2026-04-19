# -*- coding: utf-8 -*-
"""
Piyasa Servis Katmanı
Piyasa özeti ve hisse detay işlemlerinin iş mantığı burada.
"""

import yfinance as yf
from config import PIYASA_SEMBOLLERI
from utils.helpers import sembol_duzelt


def piyasa_ozeti_getir() -> list[dict]:
    """
    Ana sayfadaki canlı piyasa kartı için verileri çeker.
    BIST 100, ASELS, THYAO, Altın, Bitcoin gibi sembollerin
    güncel fiyat ve değişim yüzdesini döndürür.
    ⚠️ Frontend'de para birimi dönüşümü için HAM DEĞERLER döndürülür.
    """
    ozet = []

    for isim, kod in PIYASA_SEMBOLLERI.items():
        try:
            veri = yf.Ticker(kod).history(period="1d")
            if veri.empty:
                continue

            son = veri["Close"].iloc[-1]
            acilis = veri["Open"].iloc[-1]
            degisim = ((son - acilis) / acilis) * 100

            ozet.append({
                "isim": isim,
                "kod": kod,  # Para birimi tespiti için
                "deger": round(son, 2),  # HAM değer (frontend'de formatlanacak)
                "degisim_yuzde": round(degisim, 2),  # HAM yüzde
                "yon": "yukari" if degisim >= 0 else "asagi",
            })

        except Exception as e:
            print(f"Piyasa veri hatası ({isim}): {e}")
            continue

    return ozet


def hisse_detay_getir(sembol: str) -> dict:
    """
    Tek bir hissenin güncel detaylarını çeker.
    Başarılı: {"sembol": "THYAO", "fiyat": 250.50, ...}
    Başarısız: {"hata": "Hisse bulunamadı"}
    """
    kod = sembol_duzelt(sembol)

    try:
        hisse = yf.Ticker(kod)
        bilgi = hisse.info
        hist = hisse.history(period="1d")

        if hist.empty:
            return {"hata": "Veri yok"}

        fiyat = hist["Close"].iloc[-1]
        onceki = bilgi.get("previousClose", fiyat)
        yuzde = ((fiyat - onceki) / onceki) * 100

        return {
            "sembol": sembol.upper(),
            "isim": bilgi.get("longName", ""),
            "fiyat": round(fiyat, 2),
            "degisim": f"%{yuzde:.2f}",
            "yon": "yukari" if yuzde >= 0 else "asagi",
        }

    except Exception as e:
        return {"hata": f"Hisse bulunamadı: {str(e)}"}
