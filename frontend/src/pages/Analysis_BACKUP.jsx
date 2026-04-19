import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { Search, Activity, BarChart3, TrendingUp, AlertCircle, Loader2, XCircle, Calendar, TrendingDown, Zap } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';

function Analysis() {
  const { format } = useCurrency();
  
  const [seciliHisse, setSeciliHisse] = useState("THYAO");
  const [aramaMetni, setAramaMetni] = useState("");
  const [periyot, setPeriyot] = useState("1A");
  const [onerilerGoster, setOnerilerGoster] = useState(false);
  const [sembolOnerileri, setSembolOnerileri] = useState([]);
  const [onerilerYukleniyor, setOnerilerYukleniyor] = useState(false);
  const [onerilerHata, setOnerilerHata] = useState(null);
  
  // Eğitim ve Test Periyodu Ayarları - Ay tabanlı
  const [toplamAy, setToplamAy] = useState(24);
  const [testAy, setTestAy] = useState(6);
  const [periyodAyarGoster, setPeriyodAyarGoster] = useState(false);
  const [periyodYukleniyor, setPeriyodYukleniyor] = useState(false);
  
  const {
    egitimBaslangicTarihi,
    egitimBitisTarihi,
    testBaslangicTarihi,
    testBitisTarihi,
  } = useMemo(() => {
    const bugun = new Date();
    const testBaslangic = new Date(bugun);
    testBaslangic.setMonth(testBaslangic.getMonth() - testAy);

    const egitimBaslangic = new Date(bugun);
    egitimBaslangic.setMonth(egitimBaslangic.getMonth() - toplamAy);

    const formatTarih = (tarih) => tarih.toISOString().split('T')[0];

    return {
      egitimBaslangicTarihi: formatTarih(egitimBaslangic),
      egitimBitisTarihi: formatTarih(testBaslangic),
      testBaslangicTarihi: formatTarih(testBaslangic),
      testBitisTarihi: formatTarih(bugun),
    };
  }, [toplamAy, testAy]);
  
  // İşlem listelerini tarih aralığına göre filtrele
  const islemleriTarihAraligindaFiltrele = (islemler, baslangicTarihi, bitisTarihi) => {
    if (!islemler || islemler.length === 0) return [];
    if (!baslangicTarihi || !bitisTarihi) return islemler;
    
    return islemler.filter(islem => {
      const islemTarihi = islem.tarih;
      // Tarih karşılaştırması YYYY-MM-DD format'ında yapılıyor
      return islemTarihi >= baslangicTarihi && islemTarihi <= bitisTarihi;
    });
  };

  const [grafikVerisi, setGrafikVerisi] = useState([]);
  const [analizSonucu, setAnalizSonucu] = useState(null);
  const [rsiBacktest, setRsiBacktest] = useState(null);
  const [maBacktest, setMaBacktest] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  const [aktifTab, setAktifTab] = useState("rsi");

  useEffect(() => {
    const analizGetir = async () => {
      setYukleniyor(true);
      setHata(null);
      
      try {
        const url = `http://127.0.0.1:8000/api/analiz/${seciliHisse}/${periyot}`;
        const cevap = await axios.get(url);
        
        setGrafikVerisi(cevap.data.grafik);
        setAnalizSonucu(cevap.data.analiz);
        setRsiBacktest(cevap.data.rsi_backtest);
        setMaBacktest(cevap.data.ma_backtest);
        setYukleniyor(false);
      } catch (error) {
        console.error("Analiz verisi alınamadı:", error);
        setHata("Aradığınız sembol bulunamadı veya veri çekilemedi.");
        setYukleniyor(false);
      }
    };

    analizGetir();
  }, [seciliHisse, periyot]);

  useEffect(() => {
    if (!onerilerGoster) return;

    const q = aramaMetni.trim();
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
  }, [aramaMetni, onerilerGoster]);

  const aktifBacktest = aktifTab === "rsi" ? rsiBacktest : maBacktest;

  // Para birimi tespiti
  const getParaBirimi = () => {
    if (!analizSonucu) return 'TRY';
    if (analizSonucu.piyasa_tipi === 'BIST') return 'TRY';
    return 'USD';
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      paddingTop: "100px", 
      paddingBottom: "40px", 
      background: "linear-gradient(to bottom, #0f172a, #1e293b)", 
      color: "white", 
      display: "flex", 
      justifyContent: "center" 
    }}>
      <div style={{ width: "100%", maxWidth: "1400px", padding: "0 20px" }}>
        
        {/* ÜST BAR - Gradient Card */}
        <div style={{ 
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.1))", 
          borderRadius: "24px", 
          padding: "30px", 
          marginBottom: "30px",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 30,
          overflow: "visible"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                <h1 style={{ margin: 0, fontSize: "3rem", background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {seciliHisse}
                </h1>
                <span style={{ 
                  padding: "8px 16px", 
                  background: "rgba(56, 189, 248, 0.2)", 
                  borderRadius: "12px", 
                  color: "#38bdf8", 
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  border: "1px solid rgba(56, 189, 248, 0.3)"
                }}>
                  {analizSonucu?.piyasa_tipi}
                </span>
              </div>
              {!yukleniyor && !hata && grafikVerisi.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
                    {format(grafikVerisi[grafikVerisi.length - 1].fiyat, getParaBirimi())}
                  </span>
                  <span style={{ 
                    color: "#4ade80", 
                    fontWeight: "bold", 
                    display: "flex", 
                    alignItems: "center",
                    background: "rgba(74, 222, 128, 0.1)",
                    padding: "6px 12px",
                    borderRadius: "8px"
                  }}>
                    <Zap size={18} style={{marginRight: "5px"}}/> Canlı
                  </span>
                </div>
              )}
            </div>

            <div style={{ position: "relative", zIndex: 40 }}>
              <Search style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8", zIndex: 5 }} size={20} />
              <input 
                type="text" 
                placeholder="Sembol Ara (örn: THYAO, BTC-USD, AAPL)..." 
                value={aramaMetni}
                onChange={(e) => {
                  setAramaMetni(e.target.value.toUpperCase());
                  setOnerilerGoster(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aramaMetni.length > 0) {
                    setSeciliHisse(aramaMetni.toUpperCase());
                    setOnerilerGoster(false);
                  }
                }}
                onFocus={() => setOnerilerGoster(true)}
                onBlur={() => setTimeout(() => setOnerilerGoster(false), 200)}
                style={{ 
                  background: "rgba(15, 23, 42, 0.6)", 
                  border: "1px solid rgba(56, 189, 248, 0.3)", 
                  color: "white", 
                  padding: "12px 12px 12px 45px", 
                  borderRadius: "12px", 
                  width: "280px", 
                  outline: "none", 
                  fontSize: "1rem",
                  backdropFilter: "blur(10px)",
                  position: "relative",
                  zIndex: 6
                }}
              />
              
              {onerilerGoster && aramaMetni && (
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
                  marginTop: "-2px"
                }}>
                  {aramaMetni.trim().length < 2 && (
                    <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                      Öneriler için en az 2 karakter yazın.
                    </div>
                  )}

                  {aramaMetni.trim().length >= 2 && onerilerYukleniyor && (
                    <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                      Öneriler yükleniyor...
                    </div>
                  )}

                  {aramaMetni.trim().length >= 2 && !onerilerYukleniyor && onerilerHata && (
                    <div style={{ padding: "12px 14px", color: "#fca5a5", fontSize: "0.9rem" }}>
                      {onerilerHata}
                    </div>
                  )}

                  {aramaMetni.trim().length >= 2 && !onerilerYukleniyor && !onerilerHata && sembolOnerileri.length === 0 && (
                    <div style={{ padding: "12px 14px", color: "#94a3b8", fontSize: "0.9rem" }}>
                      Sonuç bulunamadı.
                    </div>
                  )}

                  {aramaMetni.trim().length >= 2 && !onerilerYukleniyor && !onerilerHata && sembolOnerileri.map((s, idx) => (
                    <div
                      key={`${s.sembol}-${idx}`}
                      onClick={() => {
                        setSeciliHisse(s.sembol);
                        setAramaMetni(s.sembol);
                        setOnerilerGoster(false);
                      }}
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
        </div>

        {yukleniyor ? (
          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            justifyContent: "center", 
            alignItems: "center", 
            height: "400px",
            background: "rgba(30, 41, 59, 0.5)",
            borderRadius: "24px",
            border: "1px solid #334155"
          }}>
            <Loader2 className="animate-spin" size={64} color="#38bdf8" />
            <span style={{ marginTop: "20px", fontSize: "1.2rem", color: "#94a3b8" }}>Veriler Analiz Ediliyor...</span>
          </div>
        ) : hata ? (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center", 
            height: "400px", 
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "24px", 
            border: "1px solid #ef4444" 
          }}>
            <XCircle size={64} color="#ef4444" />
            <h2 style={{ marginTop: "20px", color: "#ef4444" }}>Sonuç Bulunamadı</h2>
            <p style={{ color: "#94a3b8" }}>"{seciliHisse}" için geçerli bir veri çekilemedi.</p>
          </div>
        ) : (
          <>
            {/* GRAFİKLER - 2 Sütun */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(600px, 1fr))", gap: "20px", marginBottom: "25px" }}>
              
              {/* FİYAT & MA GRAFİĞİ */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                borderRadius: "24px", 
                border: "1px solid #334155", 
                padding: "25px",
                backdropFilter: "blur(10px)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <Activity color="#38bdf8" /> Fiyat & MA
                  </h3>
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px", padding: "4px" }}>
                    {["1H", "1A", "3A", "1Y"].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPeriyot(p)} 
                        style={{ 
                          background: periyot === p ? "#38bdf8" : "transparent", 
                          color: periyot === p ? "#0f172a" : "#94a3b8", 
                          border: "none", 
                          padding: "6px 12px", 
                          borderRadius: "6px", 
                          cursor: "pointer", 
                          fontWeight: "bold" 
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={grafikVerisi}>
                    <defs>
                      <linearGradient id="colorFiyat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="gun" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" domain={['auto', 'auto']} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} 
                      itemStyle={{ color: "#e2e8f0" }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="fiyat" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorFiyat)" 
                      name="Fiyat" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ma" 
                      stroke="#fbbf24" 
                      strokeWidth={2} 
                      dot={false} 
                      name={`MA (${analizSonucu?.optimal_ma_periyodu})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* RSI GRAFİĞİ */}
              <div style={{ 
                background: "rgba(30, 41, 59, 0.5)", 
                borderRadius: "24px", 
                border: "1px solid #334155", 
                padding: "25px",
                backdropFilter: "blur(10px)"
              }}>
                <h3 style={{ margin: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart3 color="#818cf8" /> RSI Göstergesi
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={grafikVerisi}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="gun" stroke="#94a3b8" tick={{fontSize: 12}} />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} 
                      itemStyle={{ color: "#e2e8f0" }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke="#818cf8" 
                      strokeWidth={2} 
                      dot={false} 
                      name={`RSI (${analizSonucu?.optimal_rsi_periyodu})`} 
                    />
                    {/* Aşırı alım/satım çizgileri */}
                    <Line 
                      type="monotone" 
                      dataKey={() => 70} 
                      stroke="#f87171" 
                      strokeDasharray="5 5" 
                      strokeWidth={1} 
                      dot={false} 
                      name="Aşırı Alım (70)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={() => 30} 
                      stroke="#4ade80" 
                      strokeDasharray="5 5" 
                      strokeWidth={1} 
                      dot={false} 
                      name="Aşırı Satım (30)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BACKTEST DETAYLARI */}
            <div style={{ 
              background: "rgba(30, 41, 59, 0.5)", 
              borderRadius: "24px", 
              border: "1px solid #334155", 
              padding: "30px",
              backdropFilter: "blur(10px)"
            }}>
              <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <BarChart3 size={24} color="#38bdf8" /> Backtest Sonuçları
              </h3>

              {/* TAB SELECTOR */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
                <button 
                  onClick={() => setAktifTab("rsi")} 
                  style={{ 
                    padding: "12px 24px", 
                    background: aktifTab === "rsi" ? "linear-gradient(135deg, #818cf8, #6366f1)" : "rgba(255,255,255,0.05)", 
                    color: "white", 
                    border: aktifTab === "rsi" ? "none" : "1px solid #334155", 
                    borderRadius: "12px", 
                    fontWeight: "bold", 
                    cursor: "pointer",
                    boxShadow: aktifTab === "rsi" ? "0 4px 15px rgba(129, 140, 248, 0.4)" : "none"
                  }}
                >
                  RSI Stratejisi
                </button>
                <button 
                  onClick={() => setAktifTab("ma")} 
                  style={{ 
                    padding: "12px 24px", 
                    background: aktifTab === "ma" ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "rgba(255,255,255,0.05)", 
                    color: aktifTab === "ma" ? "#0f172a" : "white", 
                    border: aktifTab === "ma" ? "none" : "1px solid #334155", 
                    borderRadius: "12px", 
                    fontWeight: "bold", 
                    cursor: "pointer",
                    boxShadow: aktifTab === "ma" ? "0 4px 15px rgba(251, 191, 36, 0.4)" : "none"
                  }}
                >
                  MA Stratejisi
                </button>
              </div>

              {/* ÖZET BİLGİLER */}
              {aktifBacktest && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05))", 
                      padding: "20px", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(56, 189, 248, 0.3)" 
                    }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Optimal Periyot</div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#38bdf8" }}>
                        {aktifTab === "rsi" ? aktifBacktest.optimal_rsi : aktifBacktest.optimal_ma}
                      </div>
                    </div>

                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(74, 222, 128, 0.05))", 
                      padding: "20px", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(74, 222, 128, 0.3)" 
                    }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Eğitim Getirisi</div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4ade80" }}>
                        %{aktifBacktest.train_getiri}
                      </div>
                    </div>

                    <div style={{ 
                      background: "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05))", 
                      padding: "20px", 
                      borderRadius: "16px", 
                      border: "1px solid rgba(251, 191, 36, 0.3)" 
                    }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Test Getirisi</div>
                      <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#fbbf24" }}>
                        %{aktifBacktest.test_getiri}
                      </div>
                    </div>
                  </div>

                  {/* TARİH ARALIĞI */}
                  <div style={{ marginBottom: "30px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                      <h4 style={{ margin: 0, color: "#38bdf8" }}>Periyot Ayarları</h4>
                      <button
                        onClick={() => setPeriyodAyarGoster(!periyodAyarGoster)}
                        style={{
                          marginLeft: "auto",
                          padding: "8px 16px",
                          background: periyodAyarGoster ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          color: "#38bdf8",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(56, 189, 248, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = periyodAyarGoster ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.05)";
                        }}
                      >
                        {periyodAyarGoster ? "Gizle" : "Aç"}
                      </button>
                    </div>
                    
                    {periyodAyarGoster && (
                      <div style={{
                        background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(129, 140, 248, 0.05))",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: "16px",
                        padding: "20px",
                        marginBottom: "20px"
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                          {/* TOPLAM AY SEÇİMİ */}
                          <div style={{
                            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05))",
                            padding: "18px",
                            borderRadius: "14px",
                            border: "1px solid rgba(56, 189, 248, 0.3)"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", color: "#38bdf8", fontWeight: "bold" }}>
                              <span style={{ fontSize: "1.2rem" }}>Toplam</span>
                              <span>Toplam Veri Periyodu</span>
                            </div>
                            
                            <label style={{ display: "block", color: "#94a3b8", marginBottom: "10px", fontSize: "0.85rem", fontWeight: "600" }}>
                              Son kaç ayın verisi kullanılsın?
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
                              {[3, 6, 12, 18, 24, 30, 36, 48].map(ay => (
                                <button
                                  key={ay}
                                  onClick={() => {
                                    setToplamAy(ay);
                                    // Test ayını sıfırla
                                    setTestAy(Math.min(6, Math.floor(ay / 3)));
                                  }}
                                  style={{
                                    padding: "10px",
                                    background: toplamAy === ay ? "linear-gradient(135deg, #38bdf8, #0ea5e9)" : "rgba(15, 23, 42, 0.6)",
                                    border: toplamAy === ay ? "2px solid #38bdf8" : "1px solid rgba(56, 189, 248, 0.2)",
                                    color: toplamAy === ay ? "white" : "#94a3b8",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "0.9rem",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (toplamAy !== ay) {
                                      e.target.style.background = "rgba(56, 189, 248, 0.1)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (toplamAy !== ay) {
                                      e.target.style.background = "rgba(15, 23, 42, 0.6)";
                                    }
                                  }}
                                >
                                  {ay} ay
                                </button>
                              ))}
                            </div>
                            <div style={{ padding: "10px", background: "rgba(56, 189, 248, 0.1)", borderRadius: "8px", color: "#38bdf8", fontSize: "0.85rem", textAlign: "center" }}>
                              Seçili: <strong>{toplamAy} ay</strong>
                            </div>
                          </div>

                          {/* TEST AY SEÇİMİ */}
                          <div style={{
                            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))",
                            padding: "18px",
                            borderRadius: "14px",
                            border: "1px solid rgba(251, 191, 36, 0.3)"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", color: "#fbbf24", fontWeight: "bold" }}>
                              <span style={{ fontSize: "1.2rem" }}>Test</span>
                              <span>Test Periyodu</span>
                            </div>
                            
                            <label style={{ display: "block", color: "#94a3b8", marginBottom: "10px", fontSize: "0.85rem", fontWeight: "600" }}>
                              Kaç ayını test için ayıralım?
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
                              {[3, 6, 9, 12].filter(ay => ay < toplamAy).map(ay => (
                                <button
                                  key={ay}
                                  onClick={() => setTestAy(ay)}
                                  style={{
                                    padding: "10px",
                                    background: testAy === ay ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "rgba(15, 23, 42, 0.6)",
                                    border: testAy === ay ? "2px solid #fbbf24" : "1px solid rgba(251, 191, 36, 0.2)",
                                    color: testAy === ay ? "#0f172a" : "#94a3b8",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "0.9rem",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    if (testAy !== ay) {
                                      e.target.style.background = "rgba(251, 191, 36, 0.1)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (testAy !== ay) {
                                      e.target.style.background = "rgba(15, 23, 42, 0.6)";
                                    }
                                  }}
                                >
                                  {ay} ay
                                </button>
                              ))}
                            </div>
                            <div style={{ padding: "10px", background: "rgba(251, 191, 36, 0.1)", borderRadius: "8px", color: "#fbbf24", fontSize: "0.85rem" }}>
                              <div>Test: <strong>{testAy} ay</strong></div>
                              <div>Eğitim: <strong>{toplamAy - testAy} ay</strong></div>
                            </div>
                          </div>
                        </div>

                        {/* ANALIZ ET BUTONU */}
                        <button
                          onClick={async () => {
                            setPeriyodYukleniyor(true);
                            try {
                              const url = `http://127.0.0.1:8000/api/analiz/${seciliHisse}/${periyot}?toplam_ay=${toplamAy}&test_ay=${testAy}`;
                              const cevap = await axios.get(url);
                              setGrafikVerisi(cevap.data.grafik);
                              setAnalizSonucu(cevap.data.analiz);
                              setRsiBacktest(cevap.data.rsi_backtest);
                              setMaBacktest(cevap.data.ma_backtest);
                              setPeriyodAyarGoster(false);
                            } catch (error) {
                              console.error("Periyod güncellemesi hatası:", error);
                              alert("Yeni periyod için analiz yapılamadı!");
                            }
                            setPeriyodYukleniyor(false);
                          }}
                          disabled={periyodYukleniyor}
                          style={{
                            width: "100%",
                            padding: "14px",
                            background: periyodYukleniyor ? "#334155" : "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            cursor: periyodYukleniyor ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            boxShadow: "0 4px 15px rgba(56, 189, 248, 0.4)",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            if (!periyodYukleniyor) {
                              e.target.style.boxShadow = "0 6px 20px rgba(56, 189, 248, 0.6)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!periyodYukleniyor) {
                              e.target.style.boxShadow = "0 4px 15px rgba(56, 189, 248, 0.4)";
                            }
                          }}
                        >
                          {periyodYukleniyor ? (
                            <>
                              <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                              Analiz Ediliyor...
                            </>
                          ) : (
                            <>
                              Yeni Periyotla Analiz Et
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Mevcut Periyod Gösterimi */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05))", padding: "15px", borderRadius: "12px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", marginBottom: "10px" }}>
                          <Calendar size={16} /> <strong>Eğitim Periyodu</strong>
                        </div>
                        <div style={{ color: "#cbd5e1", fontSize: "0.95rem", fontWeight: "600" }}>
                          {egitimBaslangicTarihi} → {egitimBitisTarihi}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "5px" }}>
                          ({toplamAy - testAy} ay)
                        </div>
                      </div>

                      <div style={{ background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))", padding: "15px", borderRadius: "12px", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", marginBottom: "10px" }}>
                          <Calendar size={16} /> <strong>Test Periyodu</strong>
                        </div>
                        <div style={{ color: "#cbd5e1", fontSize: "0.95rem", fontWeight: "600" }}>
                          {testBaslangicTarihi} → {testBitisTarihi}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "5px" }}>
                          ({testAy} ay)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* İŞLEM GEÇMİŞİ */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px" }}>
                    {/* EĞİTİM İŞLEMLERİ */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "16px",
                      padding: "20px",
                      backdropFilter: "blur(10px)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem"
                        }}>
                          EG
                        </div>
                        <h4 style={{ color: "#38bdf8", margin: 0, fontSize: "1.2rem" }}>
                          Eğitim İşlemleri
                        </h4>
                        <span style={{
                          marginLeft: "auto",
                          background: "rgba(56, 189, 248, 0.2)",
                          padding: "4px 12px",
                          borderRadius: "8px",
                          color: "#38bdf8",
                          fontSize: "0.85rem",
                          fontWeight: "bold"
                        }}>
                          {islemleriTarihAraligindaFiltrele(aktifBacktest.train_islemler, egitimBaslangicTarihi, egitimBitisTarihi).length} işlem
                        </span>
                      </div>
                      <div style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "8px" }}>
                        {islemleriTarihAraligindaFiltrele(aktifBacktest.train_islemler, egitimBaslangicTarihi, egitimBitisTarihi).length === 0 ? (
                          <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>
                            İşlem bulunamadı
                          </div>
                        ) : (
                          islemleriTarihAraligindaFiltrele(aktifBacktest.train_islemler, egitimBaslangicTarihi, egitimBitisTarihi).map((islem, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                padding: "14px", 
                                marginBottom: "10px", 
                                background: islem.islem === "AL" 
                                  ? "linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))"
                                  : "linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05))",
                                borderRadius: "12px", 
                                border: islem.islem === "AL"
                                  ? "1px solid rgba(74, 222, 128, 0.3)"
                                  : "1px solid rgba(248, 113, 113, 0.3)",
                                transition: "all 0.2s ease",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateX(4px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(56, 189, 248, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateX(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ 
                                  fontWeight: "bold", 
                                  color: islem.islem === "AL" ? "#4ade80" : "#f87171",
                                  fontSize: "1.1rem",
                                  background: islem.islem === "AL" 
                                    ? "rgba(74, 222, 128, 0.2)"
                                    : "rgba(248, 113, 113, 0.2)",
                                  padding: "4px 12px",
                                  borderRadius: "6px"
                                }}>
                                  {islem.islem === "AL" ? "AL" : "SAT"}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{islem.tarih}</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.9rem", marginBottom: "6px" }}>
                                <div>
                                  <span style={{ color: "#94a3b8" }}>Fiyat:</span>
                                  <div style={{ color: "#cbd5e1", fontWeight: "bold" }}>{format(islem.fiyat, getParaBirimi())}</div>
                                </div>
                                <div>
                                  <span style={{ color: "#94a3b8" }}>Adet:</span>
                                  <div style={{ color: "#cbd5e1", fontWeight: "bold" }}>{islem.adet}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: "0.85rem", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                                {aktifTab === "rsi" && <span style={{color: "#818cf8"}}>RSI: <strong>{islem.rsi}</strong></span>}
                                <span style={{color: "#fbbf24"}}>Bakiye: {format(islem.bakiye, 'USD')}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* TEST İŞLEMLERİ */}
                    <div style={{
                      background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      borderRadius: "16px",
                      padding: "20px",
                      backdropFilter: "blur(10px)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem"
                        }}>
                          TS
                        </div>
                        <h4 style={{ color: "#fbbf24", margin: 0, fontSize: "1.2rem" }}>
                          Test İşlemleri
                        </h4>
                        <span style={{
                          marginLeft: "auto",
                          background: "rgba(251, 191, 36, 0.2)",
                          padding: "4px 12px",
                          borderRadius: "8px",
                          color: "#fbbf24",
                          fontSize: "0.85rem",
                          fontWeight: "bold"
                        }}>
                          {islemleriTarihAraligindaFiltrele(aktifBacktest.test_islemler, testBaslangicTarihi, testBitisTarihi).length} işlem
                        </span>
                      </div>
                      <div style={{ maxHeight: "450px", overflowY: "auto", paddingRight: "8px" }}>
                        {islemleriTarihAraligindaFiltrele(aktifBacktest.test_islemler, testBaslangicTarihi, testBitisTarihi).length === 0 ? (
                          <div style={{ textAlign: "center", color: "#94a3b8", padding: "30px 0" }}>
                            İşlem bulunamadı
                          </div>
                        ) : (
                          islemleriTarihAraligindaFiltrele(aktifBacktest.test_islemler, testBaslangicTarihi, testBitisTarihi).map((islem, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                padding: "14px", 
                                marginBottom: "10px", 
                                background: islem.islem === "AL" 
                                  ? "linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))"
                                  : "linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.05))",
                                borderRadius: "12px", 
                                border: islem.islem === "AL"
                                  ? "1px solid rgba(74, 222, 128, 0.3)"
                                  : "1px solid rgba(248, 113, 113, 0.3)",
                                transition: "all 0.2s ease",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateX(4px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateX(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ 
                                  fontWeight: "bold", 
                                  color: islem.islem === "AL" ? "#4ade80" : "#f87171",
                                  fontSize: "1.1rem",
                                  background: islem.islem === "AL" 
                                    ? "rgba(74, 222, 128, 0.2)"
                                    : "rgba(248, 113, 113, 0.2)",
                                  padding: "4px 12px",
                                  borderRadius: "6px"
                                }}>
                                  {islem.islem === "AL" ? "AL" : "SAT"}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{islem.tarih}</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.9rem", marginBottom: "6px" }}>
                                <div>
                                  <span style={{ color: "#94a3b8" }}>Fiyat:</span>
                                  <div style={{ color: "#cbd5e1", fontWeight: "bold" }}>{format(islem.fiyat, getParaBirimi())}</div>
                                </div>
                                <div>
                                  <span style={{ color: "#94a3b8" }}>Adet:</span>
                                  <div style={{ color: "#cbd5e1", fontWeight: "bold" }}>{islem.adet}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: "0.85rem", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                                {aktifTab === "rsi" && <span style={{color: "#818cf8"}}>RSI: <strong>{islem.rsi}</strong></span>}
                                <span style={{color: "#fbbf24"}}>Bakiye: {format(islem.bakiye, 'USD')}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: "20px", 
                    padding: "15px", 
                    background: "rgba(251, 191, 36, 0.1)", 
                    borderRadius: "12px", 
                    color: "#fbbf24", 
                    fontSize: "0.9rem", 
                    display: "flex", 
                    gap: "10px", 
                    alignItems: "center",
                    border: "1px solid rgba(251, 191, 36, 0.3)"
                  }}>
                    <AlertCircle size={18} />
                    <span>Bu sonuçlar geçmiş verilere dayanmaktadır. Yatırım tavsiyesi değildir.</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analysis;
