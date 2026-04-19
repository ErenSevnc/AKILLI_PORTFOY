# 📈 Akıllı Portföy (AkilliPortfoy)

Akıllı Portföy, BIST hisseleri, kripto paralar, döviz ve emtiaları gerçek zamanlı olarak takip etmek için geliştirilmiş, teknik analiz ve backtest yeteneklerine sahip tam yığın (full-stack) bir portföy yönetim uygulamasıdır

## 🚀 Özellikler

**Canlı Takip & Haberler:** BIST, Kripto, Döviz ve Emtia için piyasa özeti ve kategoriye göre filtrelenmiş canlı haber akışı
**Portföy Yönetimi:** Kapsamlı CRUD işlemleri, Pie chart ile portföy dağılımı, anlık Kâr/Zarar hesabı ve yüzde değişim takibi
**Teknik Analiz:** Recharts ile oluşturulmuş interaktif grafikler üzerinde RSI ve Hareketli Ortalama (MA) indikatörleri
**Optimizasyon & Backtest:** Özelleştirilebilir dönemlere sahip backtest sistemi ve tüm periyotlar için optimizasyon doğrulaması yapan RSI/MA motoru
**Geniş Veri Desteği:** 132'den fazla desteklenen sembol, gelişmiş sembol arama (autocomplete) ve TRY, USD, EUR arasında anında para birimi dönüşümü
**Güvenli Kimlik Doğrulama:** PBKDF2-HMAC şifreleme ve Custom JWT kullanılarak oluşturulmuş güvenli giriş/kayıt sistemi

## 🛠️ Teknoloji Yığını

### Frontend (Kullanıcı Arayüzü)
**Framework:** React 19.2.0 
**Build Tool:** Vite 7.2.4 
**Routing:** React Router 7.9.6 
***HTTP İstemcisi:** Axios 1.13.2 
**Veri Görselleştirme:** Recharts 3.5.0 
**İkonlar:** Lucide React 0.555.0 

### Backend (Sunucu & API)
**Framework:** FastAPI (REST API) & Uvicorn (ASGI)
**Finansal Veri Sağlayıcı:** yfinance (Yahoo Finance entegrasyonu) 
**Veri İşleme:** pandas 
**Veritabanı:** SQLite

## 📂 Proje Mimarisi

\`\`\`text
Akilli Portfoy/
├── backend/
│   ├── main.py                 # FastAPI giriş noktası, CORS ayarları
│   ├── database.py             # SQLite, UserManager, PortfolioManager
│   ├── routes/                 # auth.py, portfolio.py, market.py vb.
│   ├── services/               # İş mantığı servisleri
│   └── optimizers/             # RSI ve MA optimizasyon algoritmaları
└── frontend/src/
    ├── App.jsx                 # Router ve Provider sarmalayıcıları
    ├── components/             # Navbar, CurrencySelector vb.
    └── pages/                  # Home, Portfolio, Analysis, News, Auth
\`\`\`

## 🗺️ Geliştirme Yol Haritası

Bu proje şu anda aktif geliştirme (Prototype) aşamasındadır. Gelecekte planlanan geliştirmeler:

- [cite_start]**Kısa Vade:** API URL ve gizli anahtarların `.env` dosyasına taşınması, React error boundary eklemeleri ve eksik Optimizasyon/Rehber sayfalarının tamamlanması[cite: 123].
- [cite_start]**Orta Vade:** Frontend tarafında TypeScript'e geçiş (tip güvenliği için), büyük component'lerin parçalanması ve test coverage (Vitest/Jest) sağlanması[cite: 80, 123].
- [cite_start]**Uzun Vade:** Üretim ortamı için PostgreSQL veritabanına geçiş, finansal veriler için Redis Cache katmanı ve gerçek zamanlı fiyat akışı için WebSocket entegrasyonu[cite: 123].
