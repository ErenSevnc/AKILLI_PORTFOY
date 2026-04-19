# -*- coding: utf-8 -*-
"""
Portföy Route'ları
/api/portfoy endpoint'leri (listele, ekle, sil, güncelle)
"""

from fastapi import APIRouter, Depends, HTTPException
from models.schemas import HisseEkle, HisseGuncelle
from services.auth_service import aktif_kullanici
from services.portfolio_service import portfoy_listele, hisse_ekle, hisse_sil, hisse_guncelle

router = APIRouter()


@router.get("/api/portfoy")
def portfoy_listesi(kullanici=Depends(aktif_kullanici)):
    """Portföydeki tüm hisseleri listele (güncel fiyatlarla)"""
    try:
        return portfoy_listele(kullanici["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portföy getirilemedi: {str(e)}")


@router.post("/api/portfoy")
def portfoy_ekle(hisse: HisseEkle, kullanici=Depends(aktif_kullanici)):
    """Portföye yeni hisse ekle"""
    sonuc = hisse_ekle(kullanici["id"], hisse.sembol, hisse.adet, hisse.maliyet)

    if "hata" in sonuc:
        raise HTTPException(status_code=404, detail=sonuc["hata"])

    return sonuc


@router.delete("/api/portfoy/{hisse_id}")
def portfoy_sil(hisse_id: int, kullanici=Depends(aktif_kullanici)):
    """Portföyden hisse sil"""
    sonuc = hisse_sil(kullanici["id"], hisse_id)

    if "hata" in sonuc:
        raise HTTPException(status_code=404, detail=sonuc["hata"])

    return sonuc


@router.put("/api/portfoy/{hisse_id}")
def portfoy_guncelle(hisse_id: int, guncelleme: HisseGuncelle, kullanici=Depends(aktif_kullanici)):
    """Portföydeki hisseyi güncelle"""
    sonuc = hisse_guncelle(
        kullanici["id"], hisse_id, adet=guncelleme.adet, maliyet=guncelleme.maliyet
    )

    if "hata" in sonuc:
        raise HTTPException(status_code=404, detail=sonuc["hata"])

    return sonuc
