import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Clock, FileText, TrendingUp, TrendingDown, Minus, Info, X, Loader2 } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';

function Home() {
  const { format } = useCurrency();
  const API_BASE = "http://127.0.0.1:8000";
  
  // --- STATE VE API ---
  const [piyasaVerileri, setPiyasaVerileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [haberler, setHaberler] = useState([]);
  const [haberYukleniyor, setHaberYukleniyor] = useState(true);
  const [haberHata, setHaberHata] = useState("");
  const [rehberPopupAcik, setRehberPopupAcik] = useState(false);
  const [rehberBaloncukAcik, setRehberBaloncukAcik] = useState(false);

  // Veri Çekme
  useEffect(() => {
    const veriCek = async () => {
      try {
        const cevap = await axios.get("http://127.0.0.1:8000/api/piyasa");
        setPiyasaVerileri(cevap.data);
        setYukleniyor(false);
      } catch (error) {
        console.error("Veri hatası:", error);
        setYukleniyor(false);
      }
    };
    veriCek();
    const zamanlayici = setInterval(veriCek, 30000); // 30 sn'de bir yenile
    return () => clearInterval(zamanlayici);
  }, []);

  useEffect(() => {
    const haberleriCek = async () => {
      setHaberYukleniyor(true);
      setHaberHata("");
      try {
        const cevap = await axios.get("http://127.0.0.1:8000/api/haberler", {
          params: { limit: 3 },
        });
        setHaberler(Array.isArray(cevap.data) ? cevap.data : []);
      } catch (error) {
        console.error("Haber hatası:", error);
        setHaberHata(error.response?.data?.detail || "Canlı haberler getirilemedi.");
        setHaberler([]);
      } finally {
        setHaberYukleniyor(false);
      }
    };

    haberleriCek();
  }, []);

  useEffect(() => {
    const popupZamanlayici = setTimeout(() => {
      setRehberPopupAcik(true);
      setRehberBaloncukAcik(false);
    }, 1200);

    return () => clearTimeout(popupZamanlayici);
  }, []);

  const popupKapat = () => {
    setRehberPopupAcik(false);
    setRehberBaloncukAcik(true);
  };

  const popupYenidenAc = () => {
    setRehberPopupAcik(true);
    setRehberBaloncukAcik(false);
  };

  // Para birimi tespiti (sembol koduna göre)
  const getParaBirimi = (kod) => {
    if (kod.endsWith('.IS') || kod.includes('XU100')) return 'TRY';
    if (kod.includes('TRY=X')) return 'TRY';
    return 'USD'; // Kripto, Altın, vs. hepsi USD
  };

  const getDurum = (yon) => {
    if (yon === "yukari") return { renk: "#4ade80", ikon: <TrendingUp size={20} /> };
    if (yon === "asagi") return { renk: "#f87171", ikon: <TrendingDown size={20} /> };
    return { renk: "#94a3b8", ikon: <Minus size={20} /> };
  };

  const haberSaatFormat = (unixTs) => {
    if (!unixTs) return "Tarih yok";
    const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixTs);
    if (diff < 60) return "Az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
  };

  const proxyResimUrl = (url) => {
    if (!url) return "";
    return `${API_BASE}/api/haber-resim?url=${encodeURIComponent(url)}`;
  };

  const handleHaberGorselHata = (event, orijinalUrl) => {
    const img = event.currentTarget;
    if (!img.dataset.fallbackDenendi && orijinalUrl) {
      img.dataset.fallbackDenendi = "1";
      img.src = orijinalUrl;
      return;
    }
    img.style.display = "none";
  };

  return (
    <div style={{ 
      width: "100%", 
      minHeight: "100vh",
      overflowX: "hidden",
      position: "relative"
    }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
      
      {/* --- HERO SECTION (Üst Kısım) --- */}
      <div style={{ 
        minHeight: "90vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        position: "relative", 
        paddingTop: "60px" 
      }}>
        
        {/* Neon Mavi Işık Efekti */}
        <div style={{ position: "absolute", top: "10%", right: "10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.05) 45%, transparent 70%)", opacity: "0.9", borderRadius: "50%", zIndex: 0, pointerEvents: "none" }}></div>

        <div style={{ width: "100%", maxWidth: "1200px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "50px", padding: "20px", zIndex: 1 }}>
          
          {/* Sol Taraf: Slogan */}
          <div style={{ flex: "1.5", minWidth: "350px" }}>
            <h1 style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: "800", lineHeight: "1.1", marginBottom: "20px", color: "white" }}>
              Geleceğe <br />
              <span style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Yatırım Yap.</span>
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#94a3b8", maxWidth: "550px", marginBottom: "40px", lineHeight: "1.6" }}>
              Piyasaları analiz et, portföyünü güvenceye al.
            </p>
            <div style={{ display: "flex", gap: "20px" }}>
              <Link to="/analysis">
                <button style={{ padding: "16px 40px", fontSize: "1.1rem", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", transition: "0.3s" }}>
                  Analize Başla
                </button>
              </Link>
              <Link to="/portfolio">
                <button style={{ padding: "16px 40px", fontSize: "1.1rem", background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
                  Portföyüm
                </button>
              </Link>
            </div>
          </div>

          {/* Sağ Taraf: Canlı Piyasa Kartı (Para Birimi Destekli) */}
          <div style={{ flex: "1", minWidth: "300px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", maxWidth: "400px", background: "rgba(30, 41, 59, 0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "35px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
              <h3 style={{ color: "#94a3b8", marginBottom: "15px", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>CANLI PİYASA</h3>
              
              {yukleniyor ? (
                <div style={{ color: "white", textAlign: "center", padding: "20px" }}>Veriler Yükleniyor...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {piyasaVerileri.map((veri, index) => {
                    const stil = getDurum(veri.yon);
                    const paraBirimi = getParaBirimi(veri.kod);
                    
                    return (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <span style={{ fontWeight: "bold", color: "#e2e8f0", display: "block" }}>{veri.isim}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: "bold", color: "white", fontSize: "1.1rem" }}>
                            {format(veri.deger, paraBirimi)}
                          </div>
                          <div style={{ color: stil.renk, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px" }}>
                            {stil.ikon} %{veri.degisim_yuzde.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- HABERLER KISMI --- */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px 100px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px" }}>
          <div style={{ padding: "10px", background: "rgba(56, 189, 248, 0.1)", borderRadius: "12px" }}>
            <FileText color="#38bdf8" size={24} />
          </div>
          <h2 style={{ fontSize: "2rem", color: "white", margin: 0 }}>Canlı Piyasa Haberleri</h2>
          <Link to="/news" style={{ marginLeft: "auto", color: "#38bdf8", textDecoration: "none", fontWeight: "bold" }}>
            Tümünü Gör
          </Link>
        </div>
        {haberYukleniyor && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", padding: "6px 2px 20px 2px" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            Haberler yükleniyor...
          </div>
        )}

        {haberHata && (
          <div style={{ background: "rgba(127, 29, 29, 0.45)", border: "1px solid #7f1d1d", color: "#fecaca", padding: "12px", borderRadius: "10px", marginBottom: "20px" }}>
            {haberHata}
          </div>
        )}

        {!haberYukleniyor && !haberHata && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {haberler.map((haber, idx) => (
              <a
                key={`${haber.id}-${idx}`}
                href={haber.url}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div style={{ background: "rgba(30, 41, 59, 0.78)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "100%" }}>
                  <div style={{ height: "170px", background: "linear-gradient(135deg, #172554, #0f172a)" }}>
                    {haber.resim ? (
                      <img
                        src={proxyResimUrl(haber.resim)}
                        alt={haber.baslik}
                        onError={(e) => handleHaberGorselHata(e, haber.resim)}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#93c5fd", fontWeight: "bold" }}>
                        {haber.kategori || "Piyasa"} Haber
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "22px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "8px" }}>
                      <span style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "bold" }}>
                        {haber.kategori || "Genel"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#94a3b8", fontSize: "0.82rem" }}>
                        <Clock size={14} /> {haberSaatFormat(haber.tarih_unix)}
                      </span>
                    </div>

                    <h3 style={{ color: "white", fontSize: "1.15rem", margin: "0 0 10px 0", lineHeight: "1.45" }}>{haber.baslik}</h3>
                    <p style={{ color: "#94a3b8", fontSize: "0.92rem", lineHeight: "1.55", margin: "0 0 18px 0", flex: 1 }}>
                      {haber.ozet}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                      <span style={{ color: "#cbd5e1", fontWeight: "500", fontSize: "0.88rem" }}>{haber.kaynak}</span>
                      <span style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.88rem", fontWeight: "bold" }}>
                        Oku <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {rehberPopupAcik && (
        <div style={{
          position: "fixed",
          right: "18px",
          bottom: "18px",
          width: "calc(100% - 36px)",
          maxWidth: "420px",
          background: "linear-gradient(160deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 16px 36px rgba(2, 6, 23, 0.55)",
          zIndex: 1200
        }}>
          <button
            onClick={popupKapat}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Popup kapat"
          >
            <X size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <Info size={18} color="#38bdf8" />
            <strong style={{ fontSize: "0.95rem", color: "#e2e8f0" }}>Teknik Gösterge Rehberi</strong>
          </div>

          <p style={{ margin: 0, color: "#cbd5e1", lineHeight: "1.6", fontSize: "0.92rem" }}>
            RSI ve MA göstergelerini sade ve hızlı bir özetle öğrenmek için rehbere geçebilirsiniz.
          </p>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <Link to="/rsi-ma-rehberi" onClick={popupKapat} style={{ textDecoration: "none" }}>
              <button style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "none",
                background: "#38bdf8",
                color: "#0f172a",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.88rem"
              }}>
                Bağlantıyı Aç
              </button>
            </Link>
          </div>
        </div>
      )}

      {!rehberPopupAcik && rehberBaloncukAcik && (
        <button
          onClick={popupYenidenAc}
          aria-label="Rehber popup'ını aç"
          style={{
            position: "fixed",
            right: "18px",
            bottom: "18px",
            width: "54px",
            height: "54px",
            borderRadius: "999px",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            background: "linear-gradient(160deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))",
            color: "#38bdf8",
            boxShadow: "0 16px 36px rgba(2, 6, 23, 0.55)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200
          }}
        >
          <Info size={20} />
        </button>
      )}
      </div>
    </div>
  );
}

export default Home;
