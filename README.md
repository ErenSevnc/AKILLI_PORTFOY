# 📈 Akıllı Portföy (AkilliPortfoy)

[cite_start]Akıllı Portföy, BIST hisseleri, kripto paralar, döviz ve emtiaları gerçek zamanlı olarak takip etmek için geliştirilmiş, teknik analiz ve backtest yeteneklerine sahip tam yığın (full-stack) bir portföy yönetim uygulamasıdır[cite: 16].

## 🚀 Özellikler

* [cite_start]**Canlı Takip & Haberler:** BIST, Kripto, Döviz ve Emtia için piyasa özeti ve kategoriye göre filtrelenmiş canlı haber akışı[cite: 58, 60].
* [cite_start]**Portföy Yönetimi:** Kapsamlı CRUD işlemleri, Pie chart ile portföy dağılımı, anlık Kâr/Zarar hesabı ve yüzde değişim takibi[cite: 58, 68, 69].
* [cite_start]**Teknik Analiz:** Recharts ile oluşturulmuş interaktif grafikler üzerinde RSI ve Hareketli Ortalama (MA) indikatörleri[cite: 20, 58, 70].
* [cite_start]**Optimizasyon & Backtest:** Özelleştirilebilir dönemlere sahip backtest sistemi ve tüm periyotlar için optimizasyon doğrulaması yapan RSI/MA motoru[cite: 58, 71, 72].
* [cite_start]**Geniş Veri Desteği:** 132'den fazla desteklenen sembol, gelişmiş sembol arama (autocomplete) ve TRY, USD, EUR arasında anında para birimi dönüşümü[cite: 10, 13, 14, 58].
* [cite_start]**Güvenli Kimlik Doğrulama:** PBKDF2-HMAC şifreleme ve Custom JWT kullanılarak oluşturulmuş güvenli giriş/kayıt sistemi[cite: 24, 67].

## 🛠️ Teknoloji Yığını

### Frontend (Kullanıcı Arayüzü)
* [cite_start]**Framework:** React 19.2.0 [cite: 20]
* [cite_start]**Build Tool:** Vite 7.2.4 [cite: 20]
* [cite_start]**Routing:** React Router 7.9.6 [cite: 20]
* [cite_start]**HTTP İstemcisi:** Axios 1.13.2 [cite: 20]
* [cite_start]**Veri Görselleştirme:** Recharts 3.5.0 [cite: 20]
* [cite_start]**İkonlar:** Lucide React 0.555.0 [cite: 20]

### Backend (Sunucu & API)
* [cite_start]**Framework:** FastAPI (REST API) & Uvicorn (ASGI) [cite: 20]
* [cite_start]**Finansal Veri Sağlayıcı:** yfinance (Yahoo Finance entegrasyonu) [cite: 17, 24]
* [cite_start]**Veri İşleme:** pandas [cite: 24]
* [cite_start]**Veritabanı:** SQLite [cite: 24]

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

[cite_start]Bu proje şu anda aktif geliştirme (Prototype) aşamasındadır[cite: 6]. Gelecekte planlanan geliştirmeler:

- [cite_start]**Kısa Vade:** API URL ve gizli anahtarların `.env` dosyasına taşınması, React error boundary eklemeleri ve eksik Optimizasyon/Rehber sayfalarının tamamlanması[cite: 123].
- [cite_start]**Orta Vade:** Frontend tarafında TypeScript'e geçiş (tip güvenliği için), büyük component'lerin parçalanması ve test coverage (Vitest/Jest) sağlanması[cite: 80, 123].
- [cite_start]**Uzun Vade:** Üretim ortamı için PostgreSQL veritabanına geçiş, finansal veriler için Redis Cache katmanı ve gerçek zamanlı fiyat akışı için WebSocket entegrasyonu[cite: 123].
