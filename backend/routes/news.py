# -*- coding: utf-8 -*-
"""
Haber Route'ları
/api/haberler endpoint'i
"""

from urllib.request import Request, urlopen
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from services.news_service import haberleri_getir

router = APIRouter()


@router.get("/api/haberler")
def haberler(
    q: str = Query("", description="Haber arama metni"),
    kategori: str = Query("Tümü", description="Kategori filtresi"),
    limit: int = Query(30, ge=1, le=100, description="Maksimum haber adedi"),
):
    sonuc = haberleri_getir(q=q, kategori=kategori, limit=limit)
    if not sonuc:
        raise HTTPException(
            status_code=503,
            detail="Canli haber kaynagindan veri alinamadi. Lutfen daha sonra tekrar deneyin.",
        )
    return sonuc


@router.get("/api/haber-resim")
def haber_resim(url: str = Query(..., description="Orijinal haber görsel URL")):
    """
    Dış görsel URL'lerini backend üzerinden proxy eder.
    Böylece tarayıcı tarafındaki hotlink/referer kısıtlarını azaltır.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Gecersiz gorsel URL")

    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Gecersiz gorsel URL")

    referer = f"{parsed.scheme}://{parsed.netloc}/"
    base_headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
    }

    try:
        try:
            req = Request(url, headers={**base_headers, "Referer": referer})
            with urlopen(req, timeout=12) as resp:
                data = resp.read()
                content_type = resp.headers.get("Content-Type", "image/jpeg")
        except Exception:
            # Bazı CDN'ler referer başlığı ile isteği reddedebiliyor.
            req = Request(url, headers=base_headers)
            with urlopen(req, timeout=12) as resp:
                data = resp.read()
                content_type = resp.headers.get("Content-Type", "image/jpeg")

        return Response(
            content=data,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=1800"},
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Gorsel getirilemedi")
