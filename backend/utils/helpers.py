# -*- coding: utf-8 -*-
"""
Yardımcı Fonksiyonlar (Helpers)
Birden fazla yerde kullanılan genel fonksiyonlar burada.
"""

from config import SEMBOL_MAP, SEMBOL_VERITABANI


def sembol_duzelt(sembol: str) -> str:
    """
    Kullanıcının girdiği sembolu Yahoo Finance'in anlayabileceği formata çevirir.
    Örnek: 'BTC' -> 'BTC-USD', 'THYAO' -> 'THYAO.IS'
    """
    sembol = sembol.upper().strip()

    # Özel map'te varsa direkt döndür
    if sembol in SEMBOL_MAP:
        return SEMBOL_MAP[sembol]

    # Zaten formatlanmış ise (USDTRY=X, BTC-USD, THYAO.IS gibi)
    if "." in sembol or "=" in sembol or "-" in sembol:
        return sembol

    # Lokal sembol veritabanına göre format belirle
    sembol_bilgi = next(
        (item for item in SEMBOL_VERITABANI if item["sembol"].upper() == sembol),
        None
    )

    if sembol_bilgi:
        return f"{sembol}.IS" if sembol_bilgi["tip"].upper() == "BIST" else sembol

    # Veri tabanında yoksa girdiği haliyle bırak
    return sembol


def piyasa_tipi_bel(kod: str) -> str:
    """
    Sembol koduna göre piyasa tipini belirler.
    Örnek: 'THYAO.IS' -> 'BIST', 'BTC-USD' -> 'KRİPTO'
    """
    if kod.endswith(".IS"):
        return "BIST"
    elif "BTC" in kod or "ETH" in kod:
        return "KRİPTO"
    elif "=" in kod:
        return "GLOBAL"
    else:
        return "ABD"
