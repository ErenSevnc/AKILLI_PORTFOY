import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Search, TrendingUp, TrendingDown, Award, AlertTriangle, Loader2, Target, Activity, X } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';
import { normalizeSymbolInput } from '../utils/search';

export default function OptimizasyonDogrulama() {
  const { format } = useCurrency();
  
  const [tip, setTip] = useState("rsi");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState("");
  const [arananText, setArananText] = useState("");
  const [onerilerGoster, setOnerilerGoster] = useState(false);
  const [sembolOnerileri, setSembolOnerileri] = useState([]);
  const [onerilerYukleniyor, setOnerilerYukleniyor] = useState(false);
  const [onerilerHata, setOnerilerHata] = useState(null);

  useEffect(() => {
    if (!onerilerGoster) return;

    const q = normalizeSymbolInput(arananText).trim();
    if (q.length < 2) {
      setSembolOnerileri([]);
      setOnerilerHata(null);
      setOnerilerYukleniyor(false);
      return;
    }

    let iptal = false;
    setOnerilerYukleniyor(true);

    const zamanlayici = setTimeout(async () => {
      try {
        const cevap = await axios.get("http://127.0.0.1:8000/api/sembol-ara", {
          params: { q, limit: 20 },
        });

        if (!iptal) {
          setSembolOnerileri(Array.isArray(cevap.data) ? cevap.data : []);
          setOnerilerHata(null);
        }
      } catch {
        if (!iptal) {
          setSembolOnerileri([]);
          setOnerilerHata("Öneriler yüklenemedi");
        }
      } finally {
        if (!iptal) {
          setOnerilerYukleniyor(false);
        }
      }
    }, 250);

    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
    };
  }, [arananText, onerilerGoster]);

  const sembolSec = (deger, dogrula = false) => {
    const temizSembol = normalizeSymbolInput(deger).trim();
    if (!temizSembol) return;

    setArananText(temizSembol);
    setOnerilerGoster(false);

    if (dogrula) {
      void dogrulamaYap(temizSembol);
    }
  };

  const dogrulamaYap = async (hedefSembol = arananText) => {
    const sembol = normalizeSymbolInput(hedefSembol).trim();
    if (!sembol) return;

    setArananText(sembol);
    setYukleniyor(true);
    setSonuc(null);
    setHata("");
    
    try {
      const url = `http://127.0.0.1:8000/api/optimizasyon-dogrulama/${encodeURIComponent(sembol)}/${tip}`;
      const cevap = await axios.get(url);
      setSonuc(cevap.data);
    } catch (error) {
      console.error("Doğrulama hatası:", error);
      setHata(error.response?.data?.detail || "Doğrulama verisi getirilemedi.");
    }
    
    setYukleniyor(false);
  };

  const getBarColor = (getiri, optimal) => {
    if (getiri === optimal) return "#4ade80";
    if (getiri > 0) return "#38bdf8";
    return "#f87171";
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      paddingTop: "100px", 
      paddingBottom: "50px", 
      color: "white", 
      display: "flex", 
      justifyContent: "center",
      position: "relative",
      overflowX: "hidden"
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
      <div style={{ width: "100%", maxWidth: "1400px", padding: "0 20px", position: "relative", zIndex: 1 }}>
        
        {/* BAŞLIK - Modern Hero */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "40px",
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1))",
          padding: "50px 30px",
          borderRadius: "24px",
          border: "1px solid rgba(56, 189, 248, 0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <Target size={48} color="#38bdf8" />
          </div>
          <h1 style={{ 
            fontSize: "3rem", 
            marginBottom: "10px",
            background: "linear-gradient(90deg, #38bdf8, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Optimizasyon Doğrulama
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
            Algoritmanın seçtiği optimal değerin gerçekten en iyi olup olmadığını kontrol edin
          </p>
        </div>

        {/* KONTROL PANELİ - Geliştirilmiş */}
        <div style={{ 
          background: "rgba(30, 41, 59, 0.5)", 
          padding: "30px", 
          borderRadius: "24px", 
          border: "1px solid #334155", 
          marginBottom: "30px",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 30,
          overflow: "visible"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "20px", alignItems: "end" }}>
            
            <div style={{ minWidth: 0, width: "100%" }}>
              <label style={{ 
                display: "block", 
                color: "#94a3b8", 
                marginBottom: "8px", 
                fontSize: "0.9rem",
                fontWeight: "bold"
              }}>
                Sembol
              </label>
              <div style={{ position: "relative", zIndex: 40 }}>
                <input 
                  type="text" 
                  value={arananText} 
                  onChange={(e) => {
                    setArananText(normalizeSymbolInput(e.target.value));
                    setOnerilerGoster(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOnerilerGoster(false);
                      return;
                    }

                    if (e.key === "Enter") {
                      const secim = sembolOnerileri[0]?.sembol || normalizeSymbolInput(arananText).trim();
                      if (!secim) return;
                      e.preventDefault();
                      sembolSec(secim, true);
                    }
                  }}
                  onFocus={() => setOnerilerGoster(true)}
                  onBlur={() => setTimeout(() => setOnerilerGoster(false), 200)}
                  placeholder=" THYAO, BTC-USD, AAPL"
                  style={{ 
                    width: "100%", 
                    padding: "14px", 
                    background: "rgba(15, 23, 42, 0.6)", 
                    border: "1px solid rgba(56, 189, 248, 0.3)", 
                    color: "white", 
                    borderRadius: "12px", 
                    fontSize: "1rem",
                    outline: "none",
                    paddingRight: "42px",
                    boxSizing: "border-box",
                  }}
                />
                {arananText && (
                  <button
                    type="button"
                    onClick={() => {
                      setArananText("");
                      setSembolOnerileri([]);
                      setOnerilerGoster(false);
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
                
                {onerilerGoster && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    zIndex: 80,
                    backdropFilter: "blur(10px)",
                    marginTop: "6px"
                  }}>
                    {arananText.trim().length < 2 && (
                      <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                        Öneriler için en az 2 karakter yazın.
                      </div>
                    )}

                    {arananText.trim().length >= 2 && onerilerYukleniyor && (
                      <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                        Öneriler yükleniyor...
                      </div>
                    )}

                    {arananText.trim().length >= 2 && !onerilerYukleniyor && onerilerHata && (
                      <div style={{ padding: "12px 14px", color: "#fca5a5", fontSize: "0.9rem" }}>
                        {onerilerHata}
                      </div>
                    )}

                    {arananText.trim().length >= 2 && !onerilerYukleniyor && !onerilerHata && sembolOnerileri.length === 0 && (
                      <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                        Sonuç bulunamadı.
                      </div>
                    )}

                    {arananText.trim().length >= 2 && !onerilerYukleniyor && !onerilerHata && sembolOnerileri.map((s, idx) => (
                      <div
                        key={`${s.sembol}-${idx}`}
                        onMouseDown={() => sembolSec(s.sembol)}
                        style={{
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(56, 189, 248, 0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", color: "#38bdf8" }}>{s.sembol}</div>
                          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{s.isim || "-"}</div>
                        </div>
                        <span style={{
                          fontSize: "0.75rem",
                          background: "rgba(56, 189, 248, 0.2)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "#38bdf8"
                        }}>
                          {s.tip || "Diğer"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ minWidth: 0, width: "100%" }}>
              <label style={{ 
                display: "block", 
                color: "#94a3b8", 
                marginBottom: "8px", 
                fontSize: "0.9rem",
                fontWeight: "bold"
              }}>
                Strateji Tipi
              </label>
              <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
                <button
                  onClick={() => setTip("rsi")}
                  style={{
                    flex: "1 1 0",
                    padding: "12px 16px",
                    background: tip === "rsi" 
                      ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
                      : "rgba(15, 23, 42, 0.6)",
                    border: tip === "rsi"
                      ? "2px solid #38bdf8"
                      : "2px solid rgba(56, 189, 248, 0.2)",
                    boxSizing: "border-box",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: tip === "rsi" ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (tip !== "rsi") {
                      e.target.style.background = "rgba(15, 23, 42, 0.8)";
                      e.target.style.borderColor = "rgba(56, 189, 248, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tip !== "rsi") {
                      e.target.style.background = "rgba(15, 23, 42, 0.6)";
                      e.target.style.borderColor = "rgba(56, 189, 248, 0.2)";
                    }
                  }}
                >
                  RSI (4-30)
                </button>
                <button
                  onClick={() => setTip("ma")}
                  style={{
                    flex: "1 1 0",
                    padding: "12px 16px",
                    background: tip === "ma" 
                      ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
                      : "rgba(15, 23, 42, 0.6)",
                    border: tip === "ma"
                      ? "2px solid #38bdf8"
                      : "2px solid rgba(56, 189, 248, 0.2)",
                    boxSizing: "border-box",
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: tip === "ma" ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (tip !== "ma") {
                      e.target.style.background = "rgba(15, 23, 42, 0.8)";
                      e.target.style.borderColor = "rgba(56, 189, 248, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tip !== "ma") {
                      e.target.style.background = "rgba(15, 23, 42, 0.6)";
                      e.target.style.borderColor = "rgba(56, 189, 248, 0.2)";
                    }
                  }}
                >
                  MA (4-60)
                </button>
              </div>
            </div>

            <div style={{ minWidth: 0, width: "100%" }}>
              <button 
                onClick={dogrulamaYap}
                disabled={yukleniyor || !normalizeSymbolInput(arananText).trim()}
                style={{ 
                  width: "100%",
                  padding: "15px 24px", 
                  background: yukleniyor || !normalizeSymbolInput(arananText).trim()
                    ? "#334155"
                    : "linear-gradient(135deg, #38bdf8, #0ea5e9)", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "12px", 
                  fontWeight: "bold", 
                  cursor: yukleniyor || !normalizeSymbolInput(arananText).trim() ? "not-allowed" : "pointer", 
                  fontSize: "1.1rem", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: yukleniyor ? "none" : "0 4px 15px rgba(56, 189, 248, 0.4)"
                }}
              >
                {yukleniyor ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                {yukleniyor ? "Analiz Ediliyor..." : "Analiz Et"}
              </button>
            </div>
          </div>
        </div>

        {hata && (
          <div style={{
            marginBottom: "24px",
            padding: "14px 16px",
            background: "rgba(127, 29, 29, 0.45)",
            border: "1px solid rgba(248, 113, 113, 0.45)",
            borderRadius: "14px",
            color: "#fecaca",
          }}>
            {hata}
          </div>
        )}

        {/* SONUÇLAR */}
        {sonuc && (
          <>
            {/* ÖZET KARTLAR - Modern Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
              
              {/* EN İYİ PERIYOT - Hero Card */}
              <div style={{ 
                background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)", 
                padding: "30px", 
                borderRadius: "24px", 
                boxShadow: "0 10px 30px rgba(74, 222, 128, 0.4)",
                transform: "scale(1.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <Award size={28} color="#0f172a" />
                  <span style={{ color: "#0f172a", fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px" }}>
                    EN İYİ PERIYOT
                  </span>
                </div>
                <div style={{ fontSize: "4rem", fontWeight: "bold", color: "#0f172a", lineHeight: "1" }}>
                  {sonuc.optimal.periyot}
                </div>
                <div style={{ color: "#0f172a", fontSize: "1rem", marginTop: "10px", fontWeight: "600" }}>
                  Getiri: %{sonuc.optimal.getiri}
                </div>
              </div>

              {/* TEST EDİLEN PERIYOT */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                padding: "25px", 
                borderRadius: "20px", 
                border: "1px solid rgba(56, 189, 248, 0.3)",
                backdropFilter: "blur(10px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", marginBottom: "5px" }}>
                  <Activity size={18} />
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Test Edilen Periyot</span>
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white" }}>
                  {sonuc.toplam_test}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "5px" }}>
                  {tip === "rsi" ? "RSI: 4-30 arası" : "MA: 4-60 arası"}
                </div>
              </div>

              {/* İŞLEM SAYISI */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                padding: "25px", 
                borderRadius: "20px", 
                border: "1px solid rgba(129, 140, 248, 0.3)",
                backdropFilter: "blur(10px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#818cf8", marginBottom: "5px" }}>
                  <TrendingUp size={18} />
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>İşlem Sayısı</span>
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white" }}>
                  {sonuc.optimal.islem_sayisi}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "5px" }}>
                  Optimal değerde
                </div>
              </div>

              {/* SON BAKİYE */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                padding: "25px", 
                borderRadius: "20px", 
                border: "1px solid rgba(251, 191, 36, 0.3)",
                backdropFilter: "blur(10px)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", marginBottom: "5px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Son Bakiye</span>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#fbbf24" }}>
                  {format(sonuc.optimal.son_bakiye, 'USD')}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "5px" }}>
                  Başlangıç: {format(1000, 'USD')}
                </div>
              </div>

            </div>

            {/* GRAFİK - Geliştirilmiş */}
            <div style={{ 
              background: "rgba(30, 41, 59, 0.5)", 
              padding: "30px", 
              borderRadius: "24px", 
              border: "1px solid #334155", 
              marginBottom: "30px",
              backdropFilter: "blur(10px)"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "1.5rem" }}>
                Tüm Periyotların Performansı
              </h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={sonuc.tum_sonuclar}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorOptimal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="periyot" 
                    stroke="#94a3b8" 
                    tick={{fontSize: 12}}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    label={{ 
                      value: 'Getiri (%)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#94a3b8',
                      fontSize: 14
                    }} 
                    tick={{fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#0f172a", 
                      border: "1px solid #334155", 
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                    }} 
                    labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Bar dataKey="getiri" radius={[8, 8, 0, 0]}>
                    {sonuc.tum_sonuclar.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.getiri, sonuc.optimal.getiri)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* EN İYİ 5 VE EN KÖTÜ 5 - Geliştirilmiş */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "20px" }}>
              
              {/* EN İYİ 5 */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                padding: "25px", 
                borderRadius: "24px", 
                border: "1px solid rgba(74, 222, 128, 0.4)",
                backdropFilter: "blur(10px)"
              }}>
                <h3 style={{ 
                  color: "#4ade80", 
                  marginTop: 0, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "1.3rem"
                }}>
                  <TrendingUp size={24} /> En İyi 5 Periyot
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sonuc.en_iyi_5.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: "18px", 
                        background: "linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))", 
                        borderRadius: "12px", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        border: "1px solid rgba(74, 222, 128, 0.2)"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#4ade80" }}>
                          Periyot {item.periyot}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {item.islem_sayisi} işlem
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#4ade80" }}>
                          %{item.getiri}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {format(item.son_bakiye, 'USD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EN KÖTÜ 5 */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                padding: "25px", 
                borderRadius: "24px", 
                border: "1px solid rgba(248, 113, 113, 0.4)",
                backdropFilter: "blur(10px)"
              }}>
                <h3 style={{ 
                  color: "#f87171", 
                  marginTop: 0, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "1.3rem"
                }}>
                  <TrendingDown size={24} /> En Kötü 5 Periyot
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {sonuc.en_kotu_5.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: "18px", 
                        background: "linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05))", 
                        borderRadius: "12px", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        border: "1px solid rgba(248, 113, 113, 0.2)"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#f87171" }}>
                          Periyot {item.periyot}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {item.islem_sayisi} işlem
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#f87171" }}>
                          %{item.getiri}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {format(item.son_bakiye, 'USD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* UYARI - Modern */}
            <div style={{ 
              marginTop: "30px", 
              padding: "20px", 
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))", 
              border: "1px solid rgba(251, 191, 36, 0.3)", 
              borderRadius: "16px", 
              display: "flex", 
              gap: "15px", 
              alignItems: "center" 
            }}>
              <AlertTriangle size={24} color="#fbbf24" />
              <div style={{ color: "#fbbf24" }}>
                <strong>Not:</strong> Bu analiz sadece eğitim setinde yapılmıştır. Gerçek performans için test setine bakınız.
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
