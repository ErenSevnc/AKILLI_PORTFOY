# -*- coding: utf-8 -*-
"""
Optimizer veri yukleme yardimcilari.
"""

import pandas as pd
import yfinance as yf


def fiyat_verisini_hazirla(
    sembol: str,
    *,
    period: str | None = "2y",
    interval: str = "1d",
    start: str | None = None,
    end: str | None = None,
) -> pd.DataFrame:
    """Close verisini indirir; download bos donerse Ticker.history ile tekrar dener."""
    download_args = {
        "interval": interval,
        "progress": False,
    }

    if start and end:
        download_args["start"] = start
        download_args["end"] = end
    elif period:
        download_args["period"] = period

    try:
        df = yf.download(sembol, **download_args)
    except Exception:
        df = pd.DataFrame()

    if df.empty:
        try:
            ticker = yf.Ticker(sembol)
            history_args = {"interval": interval}
            if start and end:
                history_args["start"] = start
                history_args["end"] = end
            elif period:
                history_args["period"] = period

            df = ticker.history(**history_args)
        except Exception:
            return pd.DataFrame()

    if df.empty:
        return pd.DataFrame()

    if isinstance(df.columns, pd.MultiIndex):
        try:
            df = df.xs("Close", axis=1, level=0, drop_level=True)
        except Exception:
            df = df.iloc[:, 0].to_frame(name="Close")
    else:
        df = df[["Close"]] if "Close" in df.columns else df.iloc[:, 0].to_frame(name="Close")

    if isinstance(df, pd.Series):
        df = df.to_frame(name="Close")

    df.columns = ["Close"]
    df.dropna(inplace=True)

    try:
        if getattr(df.index, "tz", None) is not None:
            df.index = df.index.tz_localize(None)
    except TypeError:
        pass

    return df
