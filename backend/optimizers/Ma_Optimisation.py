import yfinance as yf
import pandas as pd
from utils.indicators import sma
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

    if train_df.empty or test_df.empty:
        split_index = int(len(df) * ((toplam_ay - test_ay) / toplam_ay))
        split_index = max(1, min(split_index, len(df) - 1))
        train_df = df.iloc[:split_index].copy()
        test_df = df.iloc[split_index:].copy()

    return train_df, test_df


def ma_hesapla_ve_optimize_et(sembol: str, toplam_ay: int = 24, test_ay: int = 6):
    """
    2 yıllık veri çeker.
    İlk 18 ayda MA periyodunu optimize eder (train),
    son 6 ayda (EOD) test eder.
    DETAYLI İŞLEM GEÇMİŞİ DÖNDÜRÜR.
    """

    try:
        if toplam_ay <= 0 or test_ay <= 0 or test_ay >= toplam_ay:
            raise ValueError("Geçersiz dönem: toplam_ay > test_ay > 0 olmalı.")

        # 1️⃣ Seçilen döneme göre veri çek ve train/test ayır
        train_df, test_df = _veri_ve_bolum_hazirla(sembol, toplam_ay, test_ay)
        if train_df.empty or test_df.empty:
            return {
                "optimal_ma": 20,
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

        en_iyi_ma = 20
        en_yuksek_train_getiri = -999999

        # 4️⃣ OPTİMİZASYON (TRAIN)
        for periyot in range(4, 61):
            ma_serisi = sma(train_df['Close'], length=periyot)

            bakiye = 1000
            pozisyonda = False
            lot = 0

            for i in range(len(train_df)):
                if pd.isna(ma_serisi.iloc[i]):
                    continue

                fiyat = train_df['Close'].iloc[i]
                ma_val = ma_serisi.iloc[i]

                if fiyat > ma_val and not pozisyonda:
                    lot = bakiye / fiyat
                    bakiye = 0
                    pozisyonda = True

                elif fiyat < ma_val and pozisyonda:
                    bakiye = lot * fiyat
                    lot = 0
                    pozisyonda = False

            if pozisyonda:
                bakiye = lot * train_df['Close'].iloc[-1]

            train_getiri = ((bakiye - 1000) / 1000) * 100

            if train_getiri > en_yuksek_train_getiri:
                en_yuksek_train_getiri = train_getiri
                en_iyi_ma = periyot

        # 5️⃣ TRAIN İŞLEMLERİNİ KAYDET (OPTIMAL MA İLE)
        train_islemler = []
        ma_train = sma(train_df['Close'], length=en_iyi_ma)
        
        bakiye = 1000
        pozisyonda = False
        lot = 0

        for i in range(len(train_df)):
            if pd.isna(ma_train.iloc[i]):
                continue

            tarih = train_df.index[i].strftime("%Y-%m-%d")
            fiyat = train_df['Close'].iloc[i]
            ma_val = ma_train.iloc[i]

            if fiyat > ma_val and not pozisyonda:
                lot = bakiye / fiyat
                bakiye = 0
                pozisyonda = True
                train_islemler.append({
                    "tarih": tarih,
                    "islem": "AL",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "bakiye": round(bakiye, 2)
                })

            elif fiyat < ma_val and pozisyonda:
                bakiye = lot * fiyat
                train_islemler.append({
                    "tarih": tarih,
                    "islem": "SAT",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "bakiye": round(bakiye, 2)
                })
                lot = 0
                pozisyonda = False

        if pozisyonda:
            bakiye = lot * train_df['Close'].iloc[-1]
            train_islemler.append({
                "tarih": train_bitis,
                "islem": "KAPAT",
                "fiyat": round(train_df['Close'].iloc[-1], 2),
                "adet": round(lot, 4),
                "bakiye": round(bakiye, 2)
            })

        # 6️⃣ TEST İŞLEMLERİ (OUT-OF-SAMPLE)
        test_islemler = []
        ma_test = sma(test_df['Close'], length=en_iyi_ma)

        bakiye = 1000
        pozisyonda = False
        lot = 0

        for i in range(len(test_df)):
            if pd.isna(ma_test.iloc[i]):
                continue

            tarih = test_df.index[i].strftime("%Y-%m-%d")
            fiyat = test_df['Close'].iloc[i]
            ma_val = ma_test.iloc[i]

            if fiyat > ma_val and not pozisyonda:
                lot = bakiye / fiyat
                bakiye = 0
                pozisyonda = True
                test_islemler.append({
                    "tarih": tarih,
                    "islem": "AL",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "bakiye": round(bakiye, 2)
                })

            elif fiyat < ma_val and pozisyonda:
                bakiye = lot * fiyat
                test_islemler.append({
                    "tarih": tarih,
                    "islem": "SAT",
                    "fiyat": round(fiyat, 2),
                    "adet": round(lot, 4),
                    "bakiye": round(bakiye, 2)
                })
                lot = 0
                pozisyonda = False

        if pozisyonda:
            bakiye = lot * test_df['Close'].iloc[-1]
            test_islemler.append({
                "tarih": test_bitis,
                "islem": "KAPAT",
                "fiyat": round(test_df['Close'].iloc[-1], 2),
                "adet": round(lot, 4),
                "bakiye": round(bakiye, 2)
            })

        test_getiri = ((bakiye - 1000) / 1000) * 100

        return {
            "optimal_ma": en_iyi_ma,
            "train_getiri": round(en_yuksek_train_getiri, 2),
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
        print(f"MA Optimizasyon Hatası ({sembol}): {e}")
        return {
            "optimal_ma": 20,
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
