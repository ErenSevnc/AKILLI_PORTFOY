import pandas as pd


def sma(series: pd.Series, length: int) -> pd.Series:
    """Simple moving average."""
    return series.rolling(window=length, min_periods=length).mean()


def rsi(series: pd.Series, length: int = 14) -> pd.Series:
    """Wilder RSI implementation without external TA dependencies."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / length, adjust=False, min_periods=length).mean()
    avg_loss = loss.ewm(alpha=1 / length, adjust=False, min_periods=length).mean()

    rs = avg_gain / avg_loss
    rsi_values = 100 - (100 / (1 + rs))

    no_loss = avg_loss == 0
    no_gain = avg_gain == 0
    rsi_values = rsi_values.mask(no_loss & ~no_gain, 100.0)
    rsi_values = rsi_values.mask(no_loss & no_gain, 50.0)

    return rsi_values
