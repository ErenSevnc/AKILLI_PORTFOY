# -*- coding: utf-8 -*-
"""
Haber Servis Katmanı
Yahoo Finance üzerinden güncel finans haberlerini çeker.
"""

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from functools import lru_cache
import html
import re
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

import yfinance as yf

from config import HABER_KAYNAKLARI

def _resim_url_getir(item: dict) -> str:
    thumb = item.get("thumbnail") or {}
    if not isinstance(thumb, dict):
        return ""

    # Bazı kayıtlarda doğrudan thumbnail.url/originalUrl bulunabiliyor.
    direct = (thumb.get("url") or thumb.get("originalUrl") or "").strip()
    if direct:
        return direct

    # Çözünürlük listesinde genelde en kaliteli görsel sonda yer alır.
    resolutions = thumb.get("resolutions") or []
    if isinstance(resolutions, list):
        for res in reversed(resolutions):
            if not isinstance(res, dict):
                continue
            url = (res.get("url") or "").strip()
            if url:
                return url
    return ""


def _metin_icinde(var_mi: str, metin: str) -> bool:
    if not var_mi:
        return True
    return var_mi.lower() in (metin or "").lower()


def _description_icinden_img(description: str) -> str:
    """RSS description HTML içindeki ilk img src değerini döndürür."""
    if not description:
        return ""
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', description, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _normalize_resim_url(base_url: str, raw_url: str) -> str:
    url = (raw_url or "").strip()
    if not url:
        return ""
    url = html.unescape(url)
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("/"):
        return urljoin(base_url, url)
    return url


@lru_cache(maxsize=512)
def _linkten_resim_getir(link: str) -> str:
    """Haber sayfasından meta görsel URL'si (og/twitter) çıkarmayı dener."""
    if not link or not link.startswith(("http://", "https://")):
        return ""

    try:
        req = Request(
            link,
            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
            },
        )
        with urlopen(req, timeout=8) as resp:
            content_type = (resp.headers.get("Content-Type") or "").lower()
            if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                return ""
            html_text = resp.read(300_000).decode("utf-8", errors="ignore")
    except Exception:
        return ""

    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+property=["\']og:image:secure_url["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+name=["\']twitter:image:src["\'][^>]+content=["\']([^"\']+)["\']',
        r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']',
    ]

    for pattern in patterns:
        match = re.search(pattern, html_text, re.IGNORECASE)
        if not match:
            continue
        normalized = _normalize_resim_url(link, match.group(1))
        if normalized.startswith(("http://", "https://")):
            return normalized

    return ""


def _rss_item_resim_getir(item: ET.Element) -> str:
    """RSS item içinden olası görsel URL'sini bulur."""
    media_ns = "{http://search.yahoo.com/mrss/}"
    atom_ns = "{http://www.w3.org/2005/Atom}"

    # 1) media:thumbnail
    thumb = item.find(f"{media_ns}thumbnail")
    if thumb is not None:
        url = (thumb.attrib.get("url") or "").strip()
        if url:
            return url

    # 2) media:content (image/*)
    for media_content in item.findall(f"{media_ns}content"):
        url = (media_content.attrib.get("url") or "").strip()
        media_type = (media_content.attrib.get("type") or "").lower()
        if url and (not media_type or media_type.startswith("image/")):
            return url

    # 3) enclosure
    for enclosure in item.findall("enclosure"):
        url = (enclosure.attrib.get("url") or "").strip()
        enc_type = (enclosure.attrib.get("type") or "").lower()
        if url and (not enc_type or enc_type.startswith("image/")):
            return url

    # 4) description HTML içinde img
    desc = item.findtext("description") or ""
    url = _description_icinden_img(desc)
    if url:
        return url

    # 5) atom:link rel=enclosure
    for atom_link in item.findall(f"{atom_ns}link"):
        rel = (atom_link.attrib.get("rel") or "").lower()
        href = (atom_link.attrib.get("href") or "").strip()
        if rel == "enclosure" and href:
            return href

    return ""


def _pubdate_to_unix(pubdate: str) -> int:
    if not pubdate:
        return 0
    try:
        dt = parsedate_to_datetime(pubdate)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp())
    except Exception:
        return 0


def _rss_haberleri_getir(q: str, kategori: str, limit: int) -> list[dict]:
    """
    Yahoo RSS üzerinden canlı haber toplar.
    yfinance haber akışı boş kaldığında ikincil canlı kaynak olarak kullanılır.
    """
    feed_map = {
        "Tümü": [
            ("Borsa", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US"),
            ("Kripto", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD&region=US&lang=en-US"),
            ("Döviz", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X&region=US&lang=en-US"),
            ("Emtia", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F&region=US&lang=en-US"),
        ],
        "Borsa": [
            ("Borsa", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US"),
            ("Borsa", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL&region=US&lang=en-US"),
        ],
        "Kripto": [
            ("Kripto", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD&region=US&lang=en-US"),
            ("Kripto", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=ETH-USD&region=US&lang=en-US"),
        ],
        "Döviz": [
            ("Döviz", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X&region=US&lang=en-US"),
            ("Döviz", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=USDTRY=X&region=US&lang=en-US"),
        ],
        "Emtia": [
            ("Emtia", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F&region=US&lang=en-US"),
            ("Emtia", "https://feeds.finance.yahoo.com/rss/2.0/headline?s=CL=F&region=US&lang=en-US"),
        ],
    }

    kaynaklar = feed_map.get(kategori, feed_map["Tümü"])
    gorulen = set()
    sonuclar = []

    for kat, feed_url in kaynaklar:
        try:
            req = Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=10) as resp:
                xml_data = resp.read()
            root = ET.fromstring(xml_data)
        except Exception:
            continue

        for item in root.findall("./channel/item"):
            baslik = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            ozet = (item.findtext("description") or "").strip()
            pubdate = (item.findtext("pubDate") or "").strip()
            resim = _rss_item_resim_getir(item)
            if not resim:
                resim = _linkten_resim_getir(link)

            if not baslik or not link:
                continue
            if link in gorulen:
                continue
            if q and not (_metin_icinde(q, baslik) or _metin_icinde(q, ozet)):
                continue

            gorulen.add(link)
            ts = _pubdate_to_unix(pubdate)
            sonuclar.append(
                {
                    "id": hash(link),
                    "baslik": baslik,
                    "ozet": ozet or "Özet bilgisi bulunmuyor.",
                    "kaynak": "Yahoo Finance RSS",
                    "url": link,
                    "tarih_unix": ts,
                    "tarih_iso": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None,
                    "kategori": kat,
                    "resim": resim,
                    "sembol": "",
                }
            )

            if len(sonuclar) >= limit:
                break
        if len(sonuclar) >= limit:
            break

    sonuclar.sort(key=lambda x: x["tarih_unix"], reverse=True)
    return sonuclar[:limit]


def _google_news_rss_getir(q: str, kategori: str, limit: int) -> list[dict]:
    """
    Yahoo erişilemezse gerçek zamanlı Google News RSS finans akışı.
    Sahte veri üretmez; yalnızca canlı kaynaklardan toplar.
    """
    feeds = {
        "Tümü": [
            ("Borsa", "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en"),
            ("Kripto", "https://news.google.com/rss/search?q=bitcoin+crypto+market&hl=en-US&gl=US&ceid=US:en"),
            ("Döviz", "https://news.google.com/rss/search?q=forex+currency+market&hl=en-US&gl=US&ceid=US:en"),
            ("Emtia", "https://news.google.com/rss/search?q=gold+oil+commodity+market&hl=en-US&gl=US&ceid=US:en"),
        ],
        "Borsa": [
            ("Borsa", "https://news.google.com/rss/search?q=stock+market+finance&hl=en-US&gl=US&ceid=US:en"),
        ],
        "Kripto": [
            ("Kripto", "https://news.google.com/rss/search?q=bitcoin+crypto+market&hl=en-US&gl=US&ceid=US:en"),
        ],
        "Döviz": [
            ("Döviz", "https://news.google.com/rss/search?q=forex+currency+market&hl=en-US&gl=US&ceid=US:en"),
        ],
        "Emtia": [
            ("Emtia", "https://news.google.com/rss/search?q=gold+oil+commodity+market&hl=en-US&gl=US&ceid=US:en"),
        ],
    }

    kaynaklar = feeds.get(kategori, feeds["Tümü"])
    gorulen = set()
    sonuclar = []

    for kat, feed_url in kaynaklar:
        try:
            req = Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=10) as resp:
                xml_data = resp.read()
            root = ET.fromstring(xml_data)
        except Exception:
            continue

        for item in root.findall("./channel/item"):
            baslik = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            ozet = (item.findtext("description") or "").strip()
            pubdate = (item.findtext("pubDate") or "").strip()
            resim = _rss_item_resim_getir(item)
            if not resim:
                resim = _linkten_resim_getir(link)

            if not baslik or not link:
                continue
            if link in gorulen:
                continue
            if q and not (_metin_icinde(q, baslik) or _metin_icinde(q, ozet)):
                continue

            gorulen.add(link)
            ts = _pubdate_to_unix(pubdate)
            sonuclar.append(
                {
                    "id": hash(link),
                    "baslik": baslik,
                    "ozet": ozet or "Özet bilgisi bulunmuyor.",
                    "kaynak": "Google News RSS",
                    "url": link,
                    "tarih_unix": ts,
                    "tarih_iso": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None,
                    "kategori": kat,
                    "resim": resim,
                    "sembol": "",
                }
            )

            if len(sonuclar) >= limit:
                break
        if len(sonuclar) >= limit:
            break

    sonuclar.sort(key=lambda x: x["tarih_unix"], reverse=True)
    return sonuclar[:limit]


def haberleri_getir(q: str = "", kategori: str = "Tümü", limit: int = 30) -> list[dict]:
    """
    Yahoo Finance haberlerini döndürür.
    q: başlık/özet araması (opsiyonel)
    kategori: Tümü/Borsa/Kripto/Döviz/Emtia
    """
    limit = max(1, min(int(limit), 100))
    q = (q or "").strip()
    kategori = (kategori or "Tümü").strip()

    secili_kaynaklar = HABER_KAYNAKLARI
    if kategori != "Tümü":
        secili_kaynaklar = [k for k in HABER_KAYNAKLARI if k["kategori"] == kategori]

    tum_haberler = []
    gorulen_linkler = set()

    for kaynak in secili_kaynaklar:
        sembol = kaynak["sembol"]
        kat = kaynak["kategori"]
        try:
            items = yf.Ticker(sembol).news or []
        except Exception:
            continue

        for item in items:
            baslik = item.get("title") or ""
            ozet = item.get("summary") or ""
            url = item.get("link") or ""

            if not baslik or not url:
                continue

            if url in gorulen_linkler:
                continue

            if q and not (_metin_icinde(q, baslik) or _metin_icinde(q, ozet)):
                continue

            gorulen_linkler.add(url)

            publish_ts = item.get("providerPublishTime")
            if isinstance(publish_ts, int):
                tarih_iso = datetime.fromtimestamp(
                    publish_ts, tz=timezone.utc
                ).isoformat()
            else:
                publish_ts = 0
                tarih_iso = None

            tum_haberler.append(
                {
                    "id": hash(url),
                    "baslik": baslik,
                    "ozet": ozet or "Özet bilgisi bulunmuyor.",
                    "kaynak": item.get("publisher") or "Yahoo Finance",
                    "url": url,
                    "tarih_unix": publish_ts,
                    "tarih_iso": tarih_iso,
                    "kategori": kat,
                    "resim": _resim_url_getir(item),
                    "sembol": sembol,
                }
            )

    tum_haberler.sort(key=lambda x: x["tarih_unix"], reverse=True)
    if tum_haberler:
        return tum_haberler[:limit]

    # yfinance akışı boşsa canlı RSS kaynağını dene (sahte veri üretmez).
    yahoo_rss = _rss_haberleri_getir(q=q, kategori=kategori, limit=limit)
    if yahoo_rss:
        return yahoo_rss

    # Yahoo domain erişilemezse canlı alternatif finans akışı.
    return _google_news_rss_getir(q=q, kategori=kategori, limit=limit)
