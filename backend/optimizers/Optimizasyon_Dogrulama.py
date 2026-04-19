import pandas as pd
from utils.indicators import sma, rsi
from optimizers.data_loader import fiyat_verisini_hazirla


def _float_or_none(value, digits: int = 2):
    try:
        if value is None or pd.isna(value):
            return None
        return float(round(float(value), digits))
    except Exception:
        return None


def ma_optimizasyon_raporu(sembol: str):
    """
    TÜM MA periyotlarının (4-60) eğitim performansını döndürür.
    Böylece seçilen optimal değerin gerçekten en iyi olup olmadığını görürüz.
    """
    try:
        df = fiyat_verisini_hazirla(sembol, period="2y", interval="1d")

        if df.empty:
            return {"hata": "Veri çekilemedi"}

        # Train/Test ayırımı
        split_index = int(len(df) * 0.75)
        split_index = max(1, min(split_index, len(df) - 1)) if len(df) > 1 else 0
        train_df = df.iloc[:split_index].copy()

        if train_df.empty:
            return {"hata": "Optimizasyon için yeterli veri bulunamadı"}

        # Tüm periyotları test et
        sonuclar = []
        
        for periyot in range(4, 61):
            ma_serisi = sma(train_df['Close'], length=periyot)
            
            bakiye = 1000
            pozisyonda = False
            lot = 0
            islem_sayisi = 0

            for i in range(len(train_df)):
                if pd.isna(ma_serisi.iloc[i]):
                    continue

                fiyat = train_df['Close'].iloc[i]
                ma_val = ma_serisi.iloc[i]

                if fiyat > ma_val and not pozisyonda:
                    lot = bakiye / fiyat
                    bakiye = 0
                    pozisyonda = True
                    islem_sayisi += 1

                elif fiyat < ma_val and pozisyonda:
                    bakiye = lot * fiyat
                    lot = 0
                    pozisyonda = False
                    islem_sayisi += 1

            if pozisyonda:
                bakiye = lot * train_df['Close'].iloc[-1]

            getiri = ((bakiye - 1000) / 1000) * 100

            sonuclar.append({
                "periyot": int(periyot),
                "getiri": _float_or_none(getiri),
                "islem_sayisi": int(islem_sayisi),
                "son_bakiye": _float_or_none(bakiye)
            })

        if not sonuclar:
            return {"hata": "Optimizasyon sonucu üretilemedi"}

        # En iyi 5 ve en kötü 5'i bul
        sonuclar_sirali = sorted(
            sonuclar,
            key=lambda x: x["getiri"] if x["getiri"] is not None else float("-inf"),
            reverse=True,
        )
        
        en_iyi = sonuclar_sirali[0]
        en_iyi_5 = sonuclar_sirali[:5]
        en_kotu_5 = sonuclar_sirali[-5:]

        return {
            "optimal": en_iyi,
            "en_iyi_5": en_iyi_5,
            "en_kotu_5": en_kotu_5,
            "tum_sonuclar": sonuclar,
            "toplam_test": len(sonuclar)
        }

    except Exception as e:
        return {"hata": str(e)}


def rsi_optimizasyon_raporu(sembol: str):
    """
    TÜM RSI periyotlarının (4-30) eğitim performansını döndürür.
    """
    try:
        df = fiyat_verisini_hazirla(sembol, period="2y", interval="1d")

        if df.empty:
            return {"hata": "Veri çekilemedi"}

        # Train ayırımı
        test_gun_sayisi = 126
        train_df = df.iloc[:-test_gun_sayisi].copy()

        if train_df.empty:
            split_index = max(1, len(df) // 2)
            train_df = df.iloc[:split_index].copy()

        if train_df.empty:
            return {"hata": "Optimizasyon için yeterli veri bulunamadı"}

        sonuclar = []

        for periyot in range(4, 31):
            rsi_serisi = rsi(train_df["Close"], length=periyot)
            
            bakiye = 1000
            pozisyonda = False
            lot = 0
            islem_sayisi = 0

            for i in range(len(train_df)):
                if pd.isna(rsi_serisi.iloc[i]):
                    continue

                fiyat = train_df["Close"].iloc[i]
                rsi_val = rsi_serisi.iloc[i]

                # AL
                if rsi_val < 30 and not pozisyonda:
                    lot = bakiye / fiyat
                    bakiye = 0
                    pozisyonda = True
                    islem_sayisi += 1

                # SAT
                elif rsi_val > 70 and pozisyonda:
                    bakiye = lot * fiyat
                    lot = 0
                    pozisyonda = False
                    islem_sayisi += 1

            if pozisyonda:
                bakiye = lot * train_df["Close"].iloc[-1]

            getiri = ((bakiye - 1000) / 1000) * 100

            sonuclar.append({
                "periyot": int(periyot),
                "getiri": _float_or_none(getiri),
                "islem_sayisi": int(islem_sayisi),
                "son_bakiye": _float_or_none(bakiye)
            })

        if not sonuclar:
            return {"hata": "Optimizasyon sonucu üretilemedi"}

        # Sıralama
        sonuclar_sirali = sorted(
            sonuclar,
            key=lambda x: x["getiri"] if x["getiri"] is not None else float("-inf"),
            reverse=True,
        )
        
        en_iyi = sonuclar_sirali[0]
        en_iyi_5 = sonuclar_sirali[:5]
        en_kotu_5 = sonuclar_sirali[-5:]

        return {
            "optimal": en_iyi,
            "en_iyi_5": en_iyi_5,
            "en_kotu_5": en_kotu_5,
            "tum_sonuclar": sonuclar,
            "toplam_test": len(sonuclar)
        }

    except Exception as e:
        return {"hata": str(e)}
