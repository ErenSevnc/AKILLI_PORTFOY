# -*- coding: utf-8 -*-
"""
Analiz Servis Katmanı
Teknik analiz, backtest ve optimizasyon doğrulama iş mantığı burada.
"""

import pandas as pd
import yfinance as yf

from config import PERIYOT_MAP
from utils.helpers import sembol_duzelt, piyasa_tipi_bel
from utils.indicators import sma, rsi
from optimizers.Rsi_Optimisation import rsi_hesapla_ve_optimize_et
from optimizers.Ma_Optimisation import ma_hesapla_ve_optimize_et
from optimizers.Optimizasyon_Dogrulama import ma_optimizasyon_raporu, rsi_optimizasyon_raporu


def _safe_round(value, digits=2):
    """JSON-safe sayısal dönüşüm: NaN/inf -> None."""
    if value is None or pd.isna(value):
        return None
    try:
        fval = float(value)
        if not pd.notna(fval):
            return None
        return round(fval, digits)
    except Exception:
        return None


def hisse_analiz(sembol: str, periyot: str, toplam_ay: int = None, test_ay: int = None) -> dict:
    """
    Hissenin grafik verilerini, RSI/MA analiz sonuçlarını
    ve backtest sonuçlarını bir arada döndürür.
    Başarılı: {"grafik": [...], "analiz": {...}, "rsi_backtest": {...}, "ma_backtest": {...}}
    Başarısız: {"hata": "..."}
    
    toplam_ay: Toplam eğitim ayı sayısı (opsiyonel)
    test_ay: Test ayı sayısı (opsiyonel)
    """
    yahoo_periyot = PERIYOT_MAP.get(periyot, "1mo")
    kod = sembol_duzelt(sembol)
    toplam_ay = toplam_ay or 24
    test_ay = test_ay or 6

    try:
        if toplam_ay <= 0 or test_ay <= 0 or test_ay >= toplam_ay:
            return {"hata": "Geçersiz dönem: toplam_ay > test_ay > 0 olmalı"}

        # RSI ve MA optimizasyonlarını çalıştır
        rsi_sonuc = rsi_hesapla_ve_optimize_et(kod, toplam_ay=toplam_ay, test_ay=test_ay)
        ma_sonuc = ma_hesapla_ve_optimize_et(kod, toplam_ay=toplam_ay, test_ay=test_ay)

        # Grafik verileri çek
        df = yf.Ticker(kod).history(period=yahoo_periyot)
        if df.empty:
            return {"hata": "Veri yok"}

        # RSI ve MA indikatörleri hesapla (harici TA bağımlılığı olmadan)
        df["rsi"] = rsi(df["Close"], length=rsi_sonuc["optimal_rsi"])
        df["ma"] = sma(df["Close"], length=ma_sonuc["optimal_ma"])

        # Grafik formatına çevir
        grafik = []
        for tarih, row in df.iterrows():
            grafik.append({
                "tarih": tarih.strftime("%Y-%m-%d"),
                "gun": tarih.strftime("%d %b"),
                "fiyat": round(row["Close"], 2),
                "acilis": round(row["Open"], 2) if "Open" in df.columns and not pd.isna(row.get("Open")) else None,
                "en_yuksek": round(row["High"], 2) if "High" in df.columns and not pd.isna(row.get("High")) else None,
                "en_dusuk": round(row["Low"], 2) if "Low" in df.columns and not pd.isna(row.get("Low")) else None,
                "hacim": int(row["Volume"]) if "Volume" in df.columns and not pd.isna(row.get("Volume")) else None,
                "ma": None if pd.isna(row.get("ma")) else round(row.get("ma"), 2),
                "rsi": None if pd.isna(row.get("rsi")) else round(row.get("rsi"), 2),
            })

        son_rsi = _safe_round(df.iloc[-1].get("rsi"), 2)

        return {
            "grafik": grafik,
            "analiz": {
                # Kısa periyotta RSI hesaplanamıyorsa None döner (JSON uyumlu)
                "rsi": son_rsi,
                "optimal_rsi_periyodu": rsi_sonuc["optimal_rsi"],
                "optimal_ma_periyodu": ma_sonuc["optimal_ma"],
                "piyasa_tipi": piyasa_tipi_bel(kod),
                "toplam_ay": toplam_ay,
                "test_ay": test_ay,
                "egitim_baslangic": rsi_sonuc.get("train_baslangic"),
                "egitim_bitis": rsi_sonuc.get("train_bitis"),
                "test_baslangic": rsi_sonuc.get("test_baslangic"),
                "test_bitis": rsi_sonuc.get("test_bitis"),
            },
            "rsi_backtest": rsi_sonuc,
            "ma_backtest": ma_sonuc,
        }

    except Exception as e:
        return {"hata": str(e)}


def optimizasyon_dogrulama(sembol: str, tip: str) -> dict:
    """
    Tüm periyotların performansını test eder ve döndürür.
    tip: 'rsi' veya 'ma'
    Başarılı: {"optimal": {...}, "en_iyi_5": [...], ...}
    Başarısız: {"hata": "..."}
    """
    kod = sembol_duzelt(sembol)

    try:
        if tip.lower() == "rsi":
            return rsi_optimizasyon_raporu(kod)
        elif tip.lower() == "ma":
            return ma_optimizasyon_raporu(kod)
        else:
            return {"hata": "Tip 'rsi' veya 'ma' olmalı"}

    except Exception as e:
        return {"hata": str(e)}
