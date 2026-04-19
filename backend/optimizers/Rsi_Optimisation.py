import yfinance as yf
import pandas as pd
from utils.indicators import rsi
from optimizers.data_loader import fiyat_verisini_hazirla


def _veri_ve_bolum_hazirla(sembol: str, toplam_ay: int, test_ay: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Seçilen toplam/test ayına göre veriyi indirir ve train/test olarak böler."""
    bitis = pd.Timestamp.utcnow().tz_localize(None)
    baslangic = bitis - pd.DateOffset(months=toplam_ay)
    test_baslangic = bitis - pd.DateOffset(months=test_ay)

    df = fiyat_verisini_hazirla(
        sembol,
        start=baslangic.strftime("%Y-%m-%d"),
        end=bitis.strftime("%Y-%m-%d"),
        interval="1d",
    )

    if df.empty:
        return pd.DataFrame(), pd.DataFrame()

    train_df = df[df.index < test_baslangic].copy()
    test_df = df[df.index >= test_baslangic].copy()

    # Veri dağılımı tarih sınırından dolayı çok dengesizse satır bazlı emniyetli ayrım.
    if train_df.empty or test_df.empty:
        split_index = int(len(df) * ((toplam_ay - test_ay) / toplam_ay))
        split_index = max(1, min(split_index, len(df) - 1))
        train_df = df.iloc[:split_index].copy()
        test_df = df.iloc[split_index:].copy()

    return train_df, test_df


def rsi_backtest_detayli(df: pd.DataFrame, periyot: int, kayit_tut=False):
    """
    RSI stratejisini backtest eder.
    kayit_tut=True ise işlem geçmişini döndürür.
    """
    rsi_serisi = rsi(df["Close"], length=periyot)

    bakiye = 1000
    pozisyonda = False
    lot = 0
    islemler = []

    for i in range(len(df)):
        if pd.isna(rsi_serisi.iloc[i]):
            continue

        tarih = df.index[i].strftime("%Y-%m-%d")
        fiyat = df["Close"].iloc[i]
        rsi_val = rsi_serisi.iloc[i]

        # AL
        if rsi_val < 30 and not pozisyonda:
            lot = bakiye / fiyat
            bakiye = 0
            pozisyonda = True
            if kayit_tut:
                islemler.append({
                    "tarih": tarih,
                    "islem": "AL",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "rsi": round(rsi_val, 2),
                    "bakiye": round(bakiye, 2)
                })

        # SAT
        elif rsi_val > 70 and pozisyonda:
            bakiye = lot * fiyat
            if kayit_tut:
                islemler.append({
                    "tarih": tarih,
                    "islem": "SAT",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "rsi": round(rsi_val, 2),
                    "bakiye": round(bakiye, 2)
                })
            lot = 0
            pozisyonda = False

    # Dönem sonunda pozisyon açıksa kapat
    if pozisyonda:
        bakiye = lot * df["Close"].iloc[-1]
        if kayit_tut:
            islemler.append({
                "tarih": df.index[-1].strftime("%Y-%m-%d"),
                "islem": "KAPAT",
                "fiyat": round(df["Close"].iloc[-1], 2),
                "adet": round(lot, 4),
                "rsi": round(rsi_serisi.iloc[-1], 2),
                "bakiye": round(bakiye, 2)
            })

    getiri = ((bakiye - 1000) / 1000) * 100

    if kayit_tut:
        return getiri, islemler
    return getiri


def rsi_hesapla_ve_optimize_et(sembol: str, toplam_ay: int = 24, test_ay: int = 6):
    """
    2 yıllık EOD veri çeker.
    İlk 18 ayda RSI periyodunu optimize eder (TRAIN),
    Son 6 ayda performansı test eder (TEST).
    DETAYLI İŞLEM GEÇMİŞİ DÖNDÜRÜR.
    """
    try:
        if toplam_ay <= 0 or test_ay <= 0 or test_ay >= toplam_ay:
            raise ValueError("Geçersiz dönem: toplam_ay > test_ay > 0 olmalı.")

        # 1️⃣ Seçilen döneme göre veri çek ve train/test ayır
        train_df, test_df = _veri_ve_bolum_hazirla(sembol, toplam_ay, test_ay)
        if train_df.empty or test_df.empty:
            return {
                "optimal_rsi": 14,
                "train_getiri": 0,
                "test_getiri": 0,
                "train_baslangic": None,
                "train_bitis": None,
                "test_baslangic": None,
                "test_bitis": None,
                "train_islemler": [],
                "test_islemler": [],
                "toplam_ay": toplam_ay,
                "test_ay": test_ay
            }

        train_baslangic = train_df.index[0].strftime("%Y-%m-%d")
        train_bitis = train_df.index[-1].strftime("%Y-%m-%d")
        test_baslangic = test_df.index[0].strftime("%Y-%m-%d")
        test_bitis = test_df.index[-1].strftime("%Y-%m-%d")

        en_iyi_rsi = 14
        en_yuksek_train_getiri = -999999

        # 4️⃣ SADECE TRAIN ÜZERİNDE OPTİMİZASYON
        for periyot in range(4, 31):
            train_getiri = rsi_backtest_detayli(train_df, periyot, kayit_tut=False)

            if train_getiri > en_yuksek_train_getiri:
                en_yuksek_train_getiri = train_getiri
                en_iyi_rsi = periyot

        # 5️⃣ TRAIN İŞLEMLERİNİ KAYDET (OPTIMAL RSI İLE)
        train_getiri, train_islemler = rsi_backtest_detayli(train_df, en_iyi_rsi, kayit_tut=True)

        # 6️⃣ TEST İŞLEMLERİ
        test_getiri, test_islemler = rsi_backtest_detayli(test_df, en_iyi_rsi, kayit_tut=True)

        return {
            "optimal_rsi": en_iyi_rsi,
            "train_getiri": round(train_getiri, 2),
            "test_getiri": round(test_getiri, 2),
            "train_baslangic": train_baslangic,
            "train_bitis": train_bitis,
            "test_baslangic": test_baslangic,
            "test_bitis": test_bitis,
            "train_islemler": train_islemler,
            "test_islemler": test_islemler,
            "toplam_ay": toplam_ay,
            "test_ay": test_ay
        }

    except Exception as e:
        print(f"RSI Optimizasyon Hatası ({sembol}): {e}")
        return {
            "optimal_rsi": 14,
            "train_getiri": 0,
            "test_getiri": 0,
            "train_baslangic": None,
            "train_bitis": None,
            "test_baslangic": None,
            "test_bitis": None,
            "train_islemler": [],
            "test_islemler": [],
            "toplam_ay": toplam_ay,
            "test_ay": test_ay
        }
