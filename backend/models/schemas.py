# -*- coding: utf-8 -*-
"""
Pydantic Modelleri (Schemas)
API request ve response yapılarını tanımlar.
Yeni bir endpoint için model mi lazım? Buraya ekle!
"""

from pydantic import BaseModel, Field
from typing import Optional


# ==========================================
# PORTFÖY MODELLERI
# ==========================================

class HisseEkle(BaseModel):
    """Portföye hisse ekleme request'i"""
    sembol: str = Field(..., description="Hisse sembolu (Örn: THYAO)")
    adet: float = Field(..., gt=0, description="Hisse adedi")
    maliyet: float = Field(..., gt=0, description="Birim maliyet fiyatı")


class HisseGuncelle(BaseModel):
    """Portföydeki hisseyi güncelleme request'i"""
    adet: Optional[float] = Field(None, gt=0, description="Yeni adet")
    maliyet: Optional[float] = Field(None, gt=0, description="Yeni maliyet")


class HisseResponse(BaseModel):
    """Portföy hisse response'u"""
    id: int
    sembol: str
    adet: float
    maliyet: float
    guncel: Optional[float] = None


# ==========================================
# SEMBOL MODELLERI
# ==========================================

class SembolResponse(BaseModel):
    """Sembol arama response'u"""
    sembol: str
    isim: str
    tip: str


class FiyatResponse(BaseModel):
    """Güncel fiyat response'u"""
    sembol: str
    kod: str
    fiyat: float
    isim: str
    tip: str


# ==========================================
# PIYASA MODELLERI
# ==========================================

class PiyasaResponse(BaseModel):
    """Piyasa özeti response'u"""
    isim: str
    deger: str
    degisim: str
    yon: str


# ==========================================
# AUTH MODELLERI
# ==========================================

class KayitIstek(BaseModel):
    """Kayıt request modeli"""
    email: str = Field(..., min_length=5, max_length=255)
    kullanici_adi: str = Field(..., min_length=3, max_length=30)
    sifre: str = Field(..., min_length=6, max_length=128)


class GirisIstek(BaseModel):
    """Giriş request modeli"""
    email: str = Field(..., min_length=5, max_length=255)
    sifre: str = Field(..., min_length=6, max_length=128)
