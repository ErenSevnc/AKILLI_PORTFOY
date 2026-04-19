# -*- coding: utf-8 -*-
"""
Ana Dosya - FastAPI App
Sadece uygulamayı başlatır ve route'ları kayıt eder.
İş mantığı burada yoktur, sadece bağlantılar.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from routes import market, portfolio, symbol, analysis, currency, auth, news

# ==========================================
# APP BAŞLATMA
# ==========================================
app = FastAPI(title="Akıllı Portföy API", version="3.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# ROUTE KAYITLARI
# ==========================================
app.include_router(market.router)       # /api/piyasa, /api/hisse/{sembol}
app.include_router(portfolio.router)    # /api/portfoy (CRUD)
app.include_router(symbol.router)       # /api/sembol-ara, /api/guncel-fiyat
app.include_router(analysis.router)     # /api/analiz, /api/optimizasyon-dogrulama
app.include_router(currency.router)     # /api/para-birimleri, /api/doviz-kurlari
app.include_router(auth.router)         # /api/auth/*
app.include_router(news.router)         # /api/haberler

# ==========================================
# SAĞLIK KONTROLÜ
# ==========================================
@app.get("/")
def health_check():
    """API çalışıyor mu kontrolü"""
    return {
        "durum": "aktif",
        "mesaj": "Akıllı Portföy API çalışıyor! 🚀",
        "versiyon": "3.0",
        "modüller": ["market", "portfolio", "symbol", "analysis", "currency", "auth", "news"],
    }
