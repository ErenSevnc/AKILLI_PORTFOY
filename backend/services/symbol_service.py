# -*- coding: utf-8 -*-
"""
Sembol Servis Katmanı
Sembol arama ve güncel fiyat getirme işlemlerinin iş mantığı burada.
"""

import yfinance as yf
from config import SEMBOL_VERITABANI
from utils.helpers import sembol_duzelt


def _quote_tipini_belirle(quote: dict) -> str:
    """Yahoo quote bilgisinden tip üretir."""
    sembol = (quote.get("symbol") or "").upper()
    quote_type = (quote.get("quoteType") or "").upper()
    borsa = (
        quote.get("exchange")
        or quote.get("exchangeDisplay")
        or quote.get("exchDisp")
        or ""
    ).upper()

    if quote_type == "CRYPTOCURRENCY" or sembol.endswith("-USD"):
        return "Kripto"
    if quote_type in {"CURRENCY", "CURRENCY_PAIR"} or "=X" in sembol:
        return "Döviz"
    if quote_type in {"FUTURE", "INDEX"}:
        return "Emtia/Endeks"
    if quote_type in {"EQUITY", "ETF", "MUTUALFUND"}:
        if sembol.endswith(".IS") or "ISTANBUL" in borsa or borsa in {"BIST", "IST"}:
            return "BIST"
        return "Hisse"
    return "Diğer"


def _yfinance_sembol_ara(q: str, limit: int) -> list[dict]:
    """
    yfinance Search ile global sembol araması yapar.
    Ağ/servis hatasında boş liste döner.
    """
    try:
        # Search, yfinance 1.x içinde mevcut. raise_errors=False ile daha güvenli.
        arama = yf.Search(
            q,
            max_results=max(limit, 20),
            news_count=0,
            lists_count=0,
            recommended=0,
            raise_errors=False,
        )
        quotes = getattr(arama, "quotes", []) or []
    except Exception:
        return []

    sonuclar = []
    for item in quotes:
        sembol = (item.get("symbol") or "").upper().strip()
        if not sembol:
            continue

        isim = (
            item.get("shortname")
            or item.get("longname")
            or item.get("name")
            or sembol
        )

        sonuclar.append({
            "sembol": sembol,
            "isim": isim,
            "tip": _quote_tipini_belirle(item),
        })

        if len(sonuclar) >= limit:
            break

    return sonuclar


def sembol_ara(q: str, limit: int = 20) -> list[dict]:
    """
    Sembol arama - Autocomplete için.
    Hem sembol adında hem şirket adında arama yapar.
    Örnek: 'ase' -> [{"sembol": "ASELS", "isim": "Aselsan", "tip": "BIST"}]
    """
    if not q or len(q.strip()) < 1:
        return []

    q = q.upper().strip()
    limit = max(1, min(int(limit), 50))

    # 1) Global kaynak: yfinance search
    yf_sonuclari = _yfinance_sembol_ara(q, limit)

    # 2) Yerel kaynak: mevcut sembol veritabanı (fallback + zenginleştirme)
    yerel_sonuclar = [
        item for item in SEMBOL_VERITABANI
        if q in item["sembol"].upper() or q in item["isim"].upper()
    ]

    # 3) Birleştir ve sembole göre tekilleştir
    birlesik = []
    gorulen = set()

    for item in yf_sonuclari + yerel_sonuclar:
        sembol = (item.get("sembol") or "").upper().strip()
        if not sembol or sembol in gorulen:
            continue
        gorulen.add(sembol)
        birlesik.append({
            "sembol": sembol,
            "isim": item.get("isim", sembol),
            "tip": item.get("tip", "Diğer"),
        })
        if len(birlesik) >= limit:
            break

    return birlesik


def guncel_fiyat_getir(sembol: str) -> dict:
    """
    Belirtilen sembolün güncel fiyatını yfinance'den çeker.
    Başarılı: {"fiyat": 250.50, "isim": "Aselsan", ...}
    Başarısız: {"hata": "Fiyat bulunamadı"}
    """
    try:
        kod = sembol_duzelt(sembol)
        ticker = yf.Ticker(kod)
        hist = ticker.history(period="1d")

        if hist.empty:
            return {"hata": "Fiyat bilgisi bulunamadı!"}

        guncel_fiyat = round(hist["Close"].iloc[-1], 2)

        # Sembol veritabanından isim ve tip bilgisini bul
        sembol_bilgi = next(
            (s for s in SEMBOL_VERITABANI if s["sembol"] == sembol.upper() or s["sembol"] == kod),
            None
        )

        return {
            "sembol": sembol.upper(),
            "kod": kod,
            "fiyat": guncel_fiyat,
            "isim": sembol_bilgi["isim"] if sembol_bilgi else "",
            "tip": sembol_bilgi["tip"] if sembol_bilgi else "Diğer",
        }

    except Exception as e:
        return {"hata": f"Fiyat getirilemedi: {str(e)}"}
