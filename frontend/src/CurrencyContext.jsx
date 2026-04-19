/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // LocalStorage'dan kayıtlı para birimini al
    return localStorage.getItem('selectedCurrency') || 'TRY';
  });
  
  const [kurlar, setKurlar] = useState({ USDTRY: 34.50, EURTRY: 37.20 });
  const symbols = { TRY: '₺', USD: '$', EUR: '€' };

  // Döviz kurlarını backend'den çek
  useEffect(() => {
    const kurlariGetir = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/doviz-kurlari');
        setKurlar(response.data);
      } catch (error) {
        console.error('Kurlar getirilemedi:', error);
      }
    };

    kurlariGetir();
    const interval = setInterval(kurlariGetir, 60000); // Her 1 dakikada bir güncelle
    return () => clearInterval(interval);
  }, []);

  // Para birimi değiştiğinde localStorage'a kaydet
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', newCurrency);
  };

  // Para birimi dönüştürme fonksiyonu
  const convert = (tutar, kaynak = 'TRY') => {
    if (!tutar || tutar === 0) return 0;
    
    // Kaynak ve hedef aynıysa direkt dön
    if (kaynak === currency) return tutar;

    // TRY -> Diğer
    if (kaynak === 'TRY') {
      if (currency === 'USD') return tutar / kurlar.USDTRY;
      if (currency === 'EUR') return tutar / kurlar.EURTRY;
    }

    // USD -> Diğer
    if (kaynak === 'USD') {
      if (currency === 'TRY') return tutar * kurlar.USDTRY;
      if (currency === 'EUR') return (tutar * kurlar.USDTRY) / kurlar.EURTRY;
    }

    // EUR -> Diğer
    if (kaynak === 'EUR') {
      if (currency === 'TRY') return tutar * kurlar.EURTRY;
      if (currency === 'USD') return (tutar * kurlar.EURTRY) / kurlar.USDTRY;
    }

    return tutar;
  };

  // Formatlanmış tutar döndür
  const format = (tutar, kaynak = 'TRY') => {
    const dönüştürülmüş = convert(tutar, kaynak);
    const symbol = symbols[currency];
    return `${dönüştürülmüş.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };

  const value = {
    currency,
    setCurrency: changeCurrency,
    kurlar,
    symbols,
    convert,
    format,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};
