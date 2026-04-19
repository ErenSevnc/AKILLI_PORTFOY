# -*- coding: utf-8 -*-
"""
Yapilandirma Dosyasi
Tum sabit degerler ve ayarlar burada tanimlanir.
Yeni bir ayar ekleme? Buraya gel!
"""
import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ==========================================
# CORS AYARLARI
# ==========================================
CORS_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # React dev server
]

# ==========================================
# VERITABANI AYARLARI
# ==========================================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/portfoy",
)

# ==========================================
# AUTH AYARLARI
# ==========================================
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "degistir-bu-secret-key")
AUTH_TOKEN_EXPIRES_MINUTES = int(os.getenv("AUTH_TOKEN_EXPIRES_MINUTES", "120"))

# ==========================================
# PIYASA SEMBOLLERI (Ana Sayfa Canlı Veri)
# ==========================================
PIYASA_SEMBOLLERI = {
    "BIST 100": "XU100.IS",
    "ASELS": "ASELS.IS",
    "THYAO": "THYAO.IS",
    "ALTIN": "GC=F",
    "BITCOIN": "BTC-USD",
}

# ==========================================
# HABER SEMBOLLERI (Yahoo Finance News)
# ==========================================
HABER_KAYNAKLARI = [
    {"sembol": "XU100.IS", "kategori": "Borsa"},
    {"sembol": "THYAO.IS", "kategori": "Borsa"},
    {"sembol": "ASELS.IS", "kategori": "Borsa"},
    {"sembol": "BTC-USD", "kategori": "Kripto"},
    {"sembol": "ETH-USD", "kategori": "Kripto"},
    {"sembol": "USDTRY=X", "kategori": "Döviz"},
    {"sembol": "EURTRY=X", "kategori": "Döviz"},
    {"sembol": "GC=F", "kategori": "Emtia"},
]

# ==========================================
# SEMBOL DÜZELTME MAP'I
# ==========================================
SEMBOL_MAP = {
    "BTC": "BTC-USD",
    "BITCOIN": "BTC-USD",
    "ETH": "ETH-USD",
    "ETHEREUM": "ETH-USD",
    "USD": "USDTRY=X",
    "DOLAR": "USDTRY=X",
    "EUR": "EURTRY=X",
    "EURO": "EURTRY=X",
    "ALTIN": "GC=F",
    "GOLD": "GC=F",
}

# ==========================================
# PERIYOT MAP'I (Analiz Sayfası)
# ==========================================
PERIYOT_MAP = {
    "1H": "5d",
    "1A": "1mo",
    "3A": "3mo",
    "1Y": "1y",
}

# ==========================================
# AUTOCOMPLETE SEMBOL VERİTABANI
# ==========================================
SEMBOL_VERITABANI = [
    # --- BIST Hisseleri ---
    {"sembol": "THYAO", "isim": "Türk Hava Yolları", "tip": "BIST"},
    {"sembol": "ASELS", "isim": "Aselsan", "tip": "BIST"},
    {"sembol": "TUPRS", "isim": "Tüpraş", "tip": "BIST"},
    {"sembol": "EREGL", "isim": "Ereğli Demir Çelik", "tip": "BIST"},
    {"sembol": "SAHOL", "isim": "Sabancı Holding", "tip": "BIST"},
    {"sembol": "KCHOL", "isim": "Koç Holding", "tip": "BIST"},
    {"sembol": "AKBNK", "isim": "Akbank", "tip": "BIST"},
    {"sembol": "GARAN", "isim": "Garanti BBVA", "tip": "BIST"},
    {"sembol": "ISCTR", "isim": "İş Bankası", "tip": "BIST"},
    {"sembol": "YKBNK", "isim": "Yapı Kredi", "tip": "BIST"},
    {"sembol": "SISE", "isim": "Şişe Cam", "tip": "BIST"},
    {"sembol": "PETKM", "isim": "Petkim", "tip": "BIST"},
    {"sembol": "BIMAS", "isim": "BIM", "tip": "BIST"},
    {"sembol": "TTKOM", "isim": "Türk Telekom", "tip": "BIST"},
    {"sembol": "TAVHL", "isim": "TAV Havalimanları", "tip": "BIST"},
    {"sembol": "HEKTS", "isim": "Hektaş", "tip": "BIST"},
    {"sembol": "KOZAL", "isim": "Koza Altın", "tip": "BIST"},
    {"sembol": "VESTL", "isim": "Vestel", "tip": "BIST"},

    # --- Kripto Paralar ---
    {"sembol": "BTC-USD", "isim": "Bitcoin", "tip": "Kripto"},
    {"sembol": "ETH-USD", "isim": "Ethereum", "tip": "Kripto"},
    {"sembol": "BNB-USD", "isim": "Binance Coin", "tip": "Kripto"},
    {"sembol": "XRP-USD", "isim": "Ripple", "tip": "Kripto"},
    {"sembol": "ADA-USD", "isim": "Cardano", "tip": "Kripto"},
    {"sembol": "SOL-USD", "isim": "Solana", "tip": "Kripto"},
    {"sembol": "DOGE-USD", "isim": "Dogecoin", "tip": "Kripto"},
    {"sembol": "AVAX-USD", "isim": "Avalanche", "tip": "Kripto"},

    # --- Döviz ---
    {"sembol": "USDTRY=X", "isim": "Dolar/TL", "tip": "Döviz"},
    {"sembol": "EURTRY=X", "isim": "Euro/TL", "tip": "Döviz"},
    {"sembol": "GBPTRY=X", "isim": "Sterlin/TL", "tip": "Döviz"},

    # --- Emtia ---
    {"sembol": "GC=F", "isim": "Altın", "tip": "Emtia"},
    {"sembol": "SI=F", "isim": "Gümüş", "tip": "Emtia"},
    {"sembol": "CL=F", "isim": "Petrol", "tip": "Emtia"},

    # --- ABD Hisseleri ---
    {"sembol": "AAPL", "isim": "Apple", "tip": "ABD"},
    {"sembol": "MSFT", "isim": "Microsoft", "tip": "ABD"},
    {"sembol": "GOOGL", "isim": "Google", "tip": "ABD"},
    {"sembol": "AMZN", "isim": "Amazon", "tip": "ABD"},
    {"sembol": "TSLA", "isim": "Tesla", "tip": "ABD"},
    {"sembol": "META", "isim": "Meta (Facebook)", "tip": "ABD"},
    {"sembol": "NVDA", "isim": "Nvidia", "tip": "ABD"},
    {"sembol": "NFLX", "isim": "Netflix", "tip": "ABD"},
]
