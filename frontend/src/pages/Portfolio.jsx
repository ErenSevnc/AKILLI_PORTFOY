import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, Plus, Trash2, X, Search, TrendingUp, Loader2 } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';
import { useAuth } from '../useAuth';
import { normalizeSymbolInput } from '../utils/search';

function Portfolio() {
  const { format, convert } = useCurrency();
  const { token, isAuthenticated } = useAuth();
  
  const [hisseler, setHisseler] = useState([]);
  
  // Form State'leri
  const [formAcik, setFormAcik] = useState(false);
  const [yeniSembol, setYeniSembol] = useState("");
  const [yeniAdet, setYeniAdet] = useState("");
  const [yeniMaliyet, setYeniMaliyet] = useState("");
  const [hata, setHata] = useState("");
  const [eklemeYukleniyor, setEklemeYukleniyor] = useState(false);

  // Autocomplete State'leri
  const [sembolOnerileri, setSembolOnerileri] = useState([]);
  const [oneriAcik, setOneriAcik] = useState(false);
  const [oneriYukleniyor, setOneriYukleniyor] = useState(false);
  const [oneriHata, setOneriHata] = useState("");
  const [fiyatYukleniyor, setFiyatYukleniyor] = useState(false);

  const formuKapat = () => {
    setFormAcik(false);
    setHata("");
    setYeniSembol("");
    setYeniAdet("");
    setYeniMaliyet("");
    setSembolOnerileri([]);
    setOneriAcik(false);
    setOneriHata("");
    setOneriYukleniyor(false);
  };

  // --- VERİLERİ ÇEK ---
  const verileriGetir = async () => {
    if (!token) return;
    try {
      const cevap = await axios.get("http://127.0.0.1:8000/api/portfoy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHisseler(cevap.data);
    } catch (error) {
      console.error("Veri çekilemedi:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    verileriGetir();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!formAcik) return;

    const q = normalizeSymbolInput(yeniSembol).trim();
    if (q.length < 2) {
      setSembolOnerileri([]);
      setOneriAcik(false);
      setOneriYukleniyor(false);
      setOneriHata("");
      return;
    }

    let iptal = false;
    setOneriYukleniyor(true);
    setOneriAcik(true);

    const zamanlayici = setTimeout(async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/sembol-ara", {
          params: { q, limit: 12 },
        });

        if (!iptal) {
          setSembolOnerileri(Array.isArray(response.data) ? response.data : []);
          setOneriHata("");
        }
      } catch (error) {
        console.error("Sembol arama hatası:", error);
        if (!iptal) {
          setSembolOnerileri([]);
          setOneriHata("Öneriler alınamadı.");
        }
      } finally {
        if (!iptal) {
          setOneriYukleniyor(false);
        }
      }
    }, 250);

    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
    };
  }, [yeniSembol, formAcik]);

  const sembolSec = (sembol) => {
    setYeniSembol(normalizeSymbolInput(sembol).trim());
    setSembolOnerileri([]);
    setOneriAcik(false);
    setOneriHata("");
  };

  // --- GÜNCEL FİYAT GETİR ---
  const guncelFiyatGetir = async () => {
    const sembol = normalizeSymbolInput(yeniSembol).trim();
    if (!sembol) return;

    setFiyatYukleniyor(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/guncel-fiyat/${encodeURIComponent(sembol)}`);
      setYeniMaliyet(response.data.fiyat);
      setHata("");
    } catch {
      setHata("Fiyat getirilemedi!");
    } finally {
      setFiyatYukleniyor(false);
    }
  };

  // --- HİSSE EKLEME ---
  const hisseEkle = async (e) => {
    e.preventDefault();
    const temizSembol = normalizeSymbolInput(yeniSembol).trim();
    
    if (!temizSembol || !yeniAdet || !yeniMaliyet) {
      setHata("Lütfen tüm alanları doldurun!");
      return;
    }

    if (parseFloat(yeniAdet) <= 0 || parseFloat(yeniMaliyet) <= 0) {
      setHata("Adet ve maliyet 0'dan büyük olmalı!");
      return;
    }

    setEklemeYukleniyor(true);
    setHata("");

    try {
      await axios.post("http://127.0.0.1:8000/api/portfoy", {
        sembol: temizSembol,
        adet: parseFloat(yeniAdet),
        maliyet: parseFloat(yeniMaliyet),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setYeniSembol("");
      setYeniAdet("");
      setYeniMaliyet("");
      formuKapat();
      verileriGetir();
    } catch (error) {
      const mesaj = error.response?.data?.detail || "Hisse eklenemedi!";
      setHata(mesaj);
    } finally {
      setEklemeYukleniyor(false);
    }
  };

  // --- HİSSE SİLME ---
  const hisseSil = async (id) => {
    if (window.confirm("Bu hisseyi portföyden silmek istiyor musun?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/portfoy/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        verileriGetir();
      } catch (error) {
        console.error("Silinemedi:", error);
      }
    }
  };

  // --- HESAPLAMALAR (Para birimi dönüşümlü) ---
  const toplamVarlik = hisseler.reduce((acc, h) => {
    const varlik = convert(h.adet * h.guncel, 'TRY');
    return acc + varlik;
  }, 0);

  const toplamMaliyet = hisseler.reduce((acc, h) => {
    const maliyet = convert(h.adet * h.maliyet, 'TRY');
    return acc + maliyet;
  }, 0);

  const toplamKar = toplamVarlik - toplamMaliyet;
  const karYuzdesi = toplamMaliyet > 0 ? (toplamKar / toplamMaliyet) * 100 : 0;

  const grafikVerisi = hisseler.map(h => ({
    name: h.sembol,
    value: convert(h.adet * h.guncel, 'TRY'),
  }));

  const COLORS = ['#38bdf8', '#818cf8', '#4ade80', '#fbbf24', '#f87171'];

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", paddingTop: "100px", color: "white", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflowX: "hidden" }}>
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
        <div style={{ maxWidth: "520px", width: "100%", margin: "0 20px", background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "26px", position: "relative", zIndex: 1 }}>
          <h2 style={{ marginTop: 0 }}>Portföy için giriş gerekli</h2>
          <p style={{ color: "#94a3b8", lineHeight: "1.7" }}>
            Kişisel portföy verilerini görebilmek ve hisse ekleyebilmek için hesabına giriş yapman gerekiyor.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button style={{ padding: "10px 14px", border: "none", borderRadius: "10px", background: "#38bdf8", color: "#0f172a", fontWeight: "bold", cursor: "pointer" }}>
                Giriş Yap
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <button style={{ padding: "10px 14px", border: "1px solid #475569", borderRadius: "10px", background: "transparent", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                Kayıt Ol
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: "100px", paddingBottom: "50px", color: "white", display: "flex", justifyContent: "center", position: "relative", overflowX: "hidden" }}>
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
      <div style={{ width: "100%", maxWidth: "1200px", padding: "0 20px", position: "relative", zIndex: 1 }}>
        
        {/* BAŞLIK & EKLE BUTONU */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Wallet color="#38bdf8" size={32} /> Portföyüm
            </h1>
            <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>Yatırımlarının anlık durumu</p>
          </div>
          <button 
            onClick={() => { setFormAcik(true); setHata(""); }} 
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}
          >
            <Plus size={20} /> Yeni Ekle
          </button>
        </div>

        {/* --- EKLEME FORMU (POP-UP) --- */}
        {formAcik && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1001 }}>
            <div style={{ background: "#1e293b", padding: "30px", borderRadius: "20px", width: "min(400px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflowY: "auto", border: "1px solid #334155", position: "relative", boxSizing: "border-box" }}>
              <button onClick={formuKapat} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <X />
              </button>
              <h2 style={{ marginTop: 0 }}>Hisse Ekle</h2>

              {hata && (
                <div style={{ background: "#7f1d1d", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "15px", fontSize: "0.9rem" }}>
                  {hata}
                </div>
              )}

              <form onSubmit={hisseEkle} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {/* Sembol Input + Autocomplete */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      placeholder="Sembol (Örn: THYAO, AAPL)"
                      value={yeniSembol}
                      onChange={(e) => {
                        const val = normalizeSymbolInput(e.target.value);
                        setYeniSembol(val);
                        setOneriAcik(true);
                        setHata("");
                      }}
                      onFocus={() => setOneriAcik(true)}
                      onBlur={() => setTimeout(() => setOneriAcik(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setOneriAcik(false);
                          return;
                        }

                        if (e.key === "Enter" && oneriAcik && sembolOnerileri.length > 0) {
                          e.preventDefault();
                          sembolSec(sembolOnerileri[0].sembol);
                        }
                      }}
                      style={{ ...inputStyle, paddingLeft: "40px", paddingRight: "40px" }}
                      aria-label="Sembol ara"
                      required
                    />
                    {yeniSembol && (
                      <button
                        type="button"
                        onClick={() => {
                          setYeniSembol("");
                          setSembolOnerileri([]);
                          setOneriAcik(false);
                          setOneriHata("");
                        }}
                        aria-label="Sembol aramasını temizle"
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Öneri Dropdown */}
                  {oneriAcik && yeniSembol.trim().length >= 2 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", marginTop: "5px", maxHeight: "250px", overflowY: "auto", zIndex: 10 }}>
                      {oneriYukleniyor && (
                        <div style={{ padding: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          Semboller yükleniyor...
                        </div>
                      )}

                      {!oneriYukleniyor && oneriHata && (
                        <div style={{ padding: "12px", color: "#fca5a5" }}>
                          {oneriHata}
                        </div>
                      )}

                      {!oneriYukleniyor && !oneriHata && sembolOnerileri.length === 0 && (
                        <div style={{ padding: "12px", color: "#94a3b8" }}>
                          Sonuç bulunamadı.
                        </div>
                      )}

                      {!oneriYukleniyor && !oneriHata && sembolOnerileri.map((oneri) => (
                        <div
                          key={oneri.sembol}
                          onMouseDown={() => sembolSec(oneri.sembol)}
                          style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #334155", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ fontWeight: "bold", color: "white" }}>{oneri.sembol}</div>
                          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{oneri.isim}</div>
                          <span style={{ fontSize: "0.75rem", background: "#1e40af", padding: "2px 8px", borderRadius: "4px", color: "#93c5fd" }}>
                            {oneri.tip}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Adet"
                  value={yeniAdet}
                  onChange={(e) => setYeniAdet(e.target.value)}
                  style={inputStyle}
                  required
                />

                {/* Maliyet + Güncel Fiyat Butonu */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Maliyet (Birim Fiyat)"
                    value={yeniMaliyet}
                    onChange={(e) => setYeniMaliyet(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={guncelFiyatGetir}
                    disabled={!yeniSembol || fiyatYukleniyor}
                    style={{
                      padding: "12px 16px",
                      background: fiyatYukleniyor ? "#334155" : "#059669",
                      border: "none",
                      borderRadius: "8px",
                      cursor: !yeniSembol || fiyatYukleniyor ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "white",
                      fontWeight: "bold",
                    }}
                    title="Güncel fiyatı getir"
                  >
                    {fiyatYukleniyor ? "..." : <>💰 <TrendingUp size={16} /></>}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={eklemeYukleniyor}
                  style={{
                    padding: "12px",
                    background: eklemeYukleniyor ? "#334155" : "#4ade80",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: eklemeYukleniyor ? "not-allowed" : "pointer",
                    color: eklemeYukleniyor ? "#94a3b8" : "#0f172a",
                  }}
                >
                  {eklemeYukleniyor ? "Ekleniyor..." : "Kaydet"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ÖZET KARTLAR */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={cardStyle}>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Toplam Varlık</div>
            <div style={{ fontSize: "2.2rem", fontWeight: "bold" }}>{format(toplamVarlik)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Kâr / Zarar</div>
            <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: toplamKar >= 0 ? "#4ade80" : "#f87171" }}>
              {toplamKar > 0 ? "+" : ""}{format(toplamKar)}
            </div>
            <div style={{ color: toplamKar >= 0 ? "#4ade80" : "#f87171" }}>%{karYuzdesi.toFixed(2)}</div>
          </div>
        </div>

        {/* TABLO VE GRAFİK */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>
          <div style={{ flex: "2", minWidth: "350px", background: "#1e293b", borderRadius: "20px", border: "1px solid #334155", padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#94a3b8" }}>
                  <th style={{ padding: "10px" }}>SEMBOL</th>
                  <th style={{ padding: "10px" }}>ADET</th>
                  <th style={{ padding: "10px" }}>MALİYET</th>
                  <th style={{ padding: "10px" }}>GÜNCEL</th>
                  <th style={{ padding: "10px" }}>K/Z</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hisseler.map((h) => {
                  const kar = convert((h.guncel - h.maliyet) * h.adet, 'TRY');
                  return (
                    <tr key={h.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "15px", fontWeight: "bold" }}>{h.sembol}</td>
                      <td style={{ padding: "15px" }}>{h.adet}</td>
                      <td style={{ padding: "15px", color: "#94a3b8" }}>{format(h.maliyet, 'TRY')}</td>
                      <td style={{ padding: "15px" }}>{format(h.guncel, 'TRY')}</td>
                      <td style={{ padding: "15px", color: kar >= 0 ? "#4ade80" : "#f87171" }}>{format(kar)}</td>
                      <td style={{ padding: "15px", textAlign: "right" }}>
                        <button onClick={() => hisseSil(h.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {hisseler.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                      Henüz hisse eklemediniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* GRAFİK */}
          <div style={{ flex: "1", minWidth: "300px", height: "400px", background: "#1e293b", borderRadius: "20px", border: "1px solid #334155", padding: "20px" }}>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Dağılım</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={grafikVerisi} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {grafikVerisi.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "none" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", background: "#0f172a", border: "1px solid #334155", color: "white", borderRadius: "8px", boxSizing: "border-box" };
const cardStyle = { background: "#1e293b", padding: "25px", borderRadius: "20px", border: "1px solid #334155" };

export default Portfolio;
