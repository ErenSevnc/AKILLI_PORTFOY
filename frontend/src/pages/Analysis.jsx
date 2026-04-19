import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, LineChart, Legend, Brush, ReferenceLine, Bar } from 'recharts';
import { Search, Activity, BarChart3, TrendingUp, AlertCircle, Loader2, XCircle, Calendar, TrendingDown, Zap, X } from 'lucide-react';
import { useCurrency } from '../CurrencyContext';
import { normalizeSymbolInput } from '../utils/search';

const TV_THEME = {
  panel: "#111827",
  panelBorder: "rgba(71, 85, 105, 0.55)",
  grid: "rgba(51, 65, 85, 0.45)",
  price: "#22d3ee",
  ma: "#f59e0b",
  rsi: "#8b5cf6",
  volume: "rgba(56, 189, 248, 0.28)",
  textSoft: "#94a3b8",
  text: "#e2e8f0",
};

function TradingTooltip({ active, payload, label, priceFormatter, volumeFormatter }) {
  if (!active || !payload || payload.length === 0) return null;
  const satir = payload[0]?.payload || {};

  return (
    <div style={{
      background: "rgba(10, 15, 27, 0.95)",
      border: "1px solid rgba(71, 85, 105, 0.8)",
      borderRadius: "10px",
      padding: "10px 12px",
      minWidth: "200px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
    }}>
      <div style={{ color: TV_THEME.text, fontWeight: 700, marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "4px", columnGap: "10px", fontSize: "0.85rem" }}>
        <span style={{ color: TV_THEME.textSoft }}>Açılış</span>
        <span style={{ color: TV_THEME.text, textAlign: "right" }}>{satir.acilis != null ? priceFormatter(satir.acilis) : "-"}</span>
        <span style={{ color: TV_THEME.textSoft }}>Yüksek</span>
        <span style={{ color: TV_THEME.text, textAlign: "right" }}>{satir.en_yuksek != null ? priceFormatter(satir.en_yuksek) : "-"}</span>
        <span style={{ color: TV_THEME.textSoft }}>Düşük</span>
        <span style={{ color: TV_THEME.text, textAlign: "right" }}>{satir.en_dusuk != null ? priceFormatter(satir.en_dusuk) : "-"}</span>
        <span style={{ color: TV_THEME.textSoft }}>Kapanış</span>
        <span style={{ color: TV_THEME.price, textAlign: "right", fontWeight: 700 }}>{priceFormatter(satir.fiyat)}</span>
        <span style={{ color: TV_THEME.textSoft }}>Hacim</span>
        <span style={{ color: TV_THEME.text, textAlign: "right" }}>{volumeFormatter(satir.hacim)}</span>
      </div>
    </div>
  );
}

function Analysis() {
  const { format } = useCurrency();
  
  const [seciliHisse, setSeciliHisse] = useState("THYAO");
  const [aramaMetni, setAramaMetni] = useState("THYAO");
  const [periyot, setPeriyot] = useState("1A");
  const [onerilerGoster, setOnerilerGoster] = useState(false);
  const [sembolOnerileri, setSembolOnerileri] = useState([]);
  const [onerilerYukleniyor, setOnerilerYukleniyor] = useState(false);
  const [onerilerHata, setOnerilerHata] = useState(null);
  
  // Eğitim ve Test Periyodu Ayarları - Ay tabanlı
  const [toplamAy, setToplamAy] = useState(24);
  const [testAy, setTestAy] = useState(6);
  const [uygulananToplamAy, setUygulananToplamAy] = useState(24);
  const [uygulananTestAy, setUygulananTestAy] = useState(6);
  const [periyodAyarGoster, setPeriyodAyarGoster] = useState(false);
  const [periyodYukleniyor, setPeriyodYukleniyor] = useState(false);
  
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
  const [hoveredDate, setHoveredDate] = useState(null);

  const analizGetir = useCallback(async (toplamAyParam = uygulananToplamAy, testAyParam = uygulananTestAy) => {
    setYukleniyor(true);
    setHata(null);

    try {
      const url = `http://127.0.0.1:8000/api/analiz/${encodeURIComponent(seciliHisse)}/${periyot}?toplam_ay=${toplamAyParam}&test_ay=${testAyParam}`;
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
  }, [seciliHisse, periyot, uygulananToplamAy, uygulananTestAy]);

  useEffect(() => {
    const zamanlayici = setTimeout(() => {
      analizGetir();
    }, 0);

    return () => clearTimeout(zamanlayici);
  }, [analizGetir]);

  useEffect(() => {
    if (!onerilerGoster) return;

    const q = normalizeSymbolInput(aramaMetni).trim();
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

  const sembolSec = useCallback((deger) => {
    const temizSembol = normalizeSymbolInput(deger).trim();
    if (!temizSembol) return;

    setSeciliHisse(temizSembol);
    setAramaMetni(temizSembol);
    setOnerilerGoster(false);
  }, []);

  const aktifBacktest = aktifTab === "rsi" ? rsiBacktest : maBacktest;
  const egitimBaslangicTarihi = aktifBacktest?.train_baslangic || null;
  const egitimBitisTarihi = aktifBacktest?.train_bitis || null;
  const testBaslangicTarihi = aktifBacktest?.test_baslangic || null;
  const testBitisTarihi = aktifBacktest?.test_bitis || null;
  const uygulananToplam = aktifBacktest?.toplam_ay || uygulananToplamAy;
  const uygulananTest = aktifBacktest?.test_ay || uygulananTestAy;

  // Para birimi tespiti
  const getParaBirimi = () => {
    if (!analizSonucu) return 'TRY';
    if (analizSonucu.piyasa_tipi === 'BIST') return 'TRY';
    return 'USD';
  };

  const xAxisFormatter = (value) => {
    if (!value) return "";
    const tarih = new Date(value);
    return `${String(tarih.getDate()).padStart(2, '0')}/${String(tarih.getMonth() + 1).padStart(2, '0')}`;
  };

  const hacimFormatla = (deger) => {
    if (deger == null) return "-";
    if (deger >= 1_000_000_000) return `${(deger / 1_000_000_000).toFixed(2)}B`;
    if (deger >= 1_000_000) return `${(deger / 1_000_000).toFixed(2)}M`;
    if (deger >= 1_000) return `${(deger / 1_000).toFixed(1)}K`;
    return `${deger}`;
  };

  const sonBar = grafikVerisi.length > 0 ? grafikVerisi[grafikVerisi.length - 1] : null;
  const oncekiBar = grafikVerisi.length > 1 ? grafikVerisi[grafikVerisi.length - 2] : null;
  const degisimYuzde = sonBar && oncekiBar
    ? (((sonBar.fiyat - oncekiBar.fiyat) / oncekiBar.fiyat) * 100)
    : 0;
  const degisimPozitif = degisimYuzde >= 0;

  return (
    <div style={{ 
      minHeight: "100vh", 
      paddingTop: "100px", 
      paddingBottom: "40px", 
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
        
        {/* ÜST BAR - Gradient Card */}
        <div style={{ 
          background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(10,14,25,0.95) 100%)", 
          borderRadius: "24px", 
          padding: "30px", 
          marginBottom: "30px",
          border: `1px solid ${TV_THEME.panelBorder}`,
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
                    color: degisimPozitif ? "#10b981" : "#ef4444",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: degisimPozitif ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)"
                  }}>
                    {degisimPozitif ? "+" : ""}{degisimYuzde.toFixed(2)}%
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
                  setAramaMetni(normalizeSymbolInput(e.target.value));
                  setOnerilerGoster(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOnerilerGoster(false);
                    return;
                  }

                  if (e.key === 'Enter') {
                    const secim = sembolOnerileri[0]?.sembol || normalizeSymbolInput(aramaMetni).trim();
                    if (!secim) return;
                    e.preventDefault();
                    sembolSec(secim);
                  }
                }}
                onFocus={() => setOnerilerGoster(true)}
                onBlur={() => setTimeout(() => setOnerilerGoster(false), 200)}
                style={{ 
                  background: "rgba(15, 23, 42, 0.6)", 
                  border: "1px solid rgba(56, 189, 248, 0.3)", 
                  color: "white", 
                  padding: "12px 44px 12px 45px", 
                  borderRadius: "12px", 
                  width: "min(100%, 320px)", 
                  outline: "none", 
                  fontSize: "1rem",
                  boxSizing: "border-box",
                  backdropFilter: "blur(10px)",
                  position: "relative",
                  zIndex: 6
                }}
              />
              {aramaMetni && (
                <button
                  type="button"
                  onClick={() => {
                    setAramaMetni("");
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
                    zIndex: 7,
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 600px), 1fr))", gap: "20px", marginBottom: "25px" }}>
              
              {/* FİYAT & MA GRAFİĞİ */}
              <div style={{ 
                background: `linear-gradient(180deg, ${TV_THEME.panel} 0%, #0b1220 100%)`, 
                borderRadius: "24px", 
                border: `1px solid ${TV_THEME.panelBorder}`, 
                padding: "25px",
                backdropFilter: "blur(10px)",
                boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.6), 0 14px 30px rgba(2,6,23,0.45)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px", gap: "10px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", color: TV_THEME.text }}>
                    <Activity color={TV_THEME.price} /> Price & MA
                  </h3>
                  <div style={{ background: "rgba(15, 23, 42, 0.95)", borderRadius: "10px", padding: "4px", border: "1px solid rgba(71,85,105,0.45)" }}>
                    {["1H", "1A", "3A", "1Y"].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPeriyot(p)} 
                        style={{ 
                          background: periyot === p ? "rgba(34,211,238,0.2)" : "transparent", 
                          color: periyot === p ? "#67e8f9" : "#94a3b8", 
                          border: "none", 
                          padding: "6px 12px", 
                          borderRadius: "6px", 
                          cursor: "pointer", 
                          fontWeight: "bold",
                          letterSpacing: "0.2px"
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {sonBar && (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "12px", color: TV_THEME.textSoft, fontSize: "0.86rem" }}>
                    <span>O: <strong style={{ color: TV_THEME.text }}>{sonBar.acilis ? format(sonBar.acilis, getParaBirimi()) : "-"}</strong></span>
                    <span>H: <strong style={{ color: TV_THEME.text }}>{sonBar.en_yuksek ? format(sonBar.en_yuksek, getParaBirimi()) : "-"}</strong></span>
                    <span>L: <strong style={{ color: TV_THEME.text }}>{sonBar.en_dusuk ? format(sonBar.en_dusuk, getParaBirimi()) : "-"}</strong></span>
                    <span>C: <strong style={{ color: TV_THEME.price }}>{format(sonBar.fiyat, getParaBirimi())}</strong></span>
                    <span>Vol: <strong style={{ color: TV_THEME.text }}>{hacimFormatla(sonBar.hacim)}</strong></span>
                  </div>
                )}
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={grafikVerisi}
                    syncId="analysis-sync"
                    onMouseMove={(state) => setHoveredDate(state?.activeLabel || null)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke={TV_THEME.grid} vertical={false} />
                    <XAxis dataKey="tarih" stroke={TV_THEME.textSoft} tick={{fontSize: 12}} tickFormatter={xAxisFormatter} />
                    <YAxis yAxisId="price" stroke={TV_THEME.textSoft} domain={['auto', 'auto']} tick={{fontSize: 12}} />
                    <YAxis yAxisId="volume" hide domain={[0, 'dataMax']} />
                    <Tooltip 
                      content={
                        <TradingTooltip
                          priceFormatter={(value) => format(value, getParaBirimi())}
                          volumeFormatter={hacimFormatla}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ color: TV_THEME.textSoft }} />
                    <Bar yAxisId="volume" dataKey="hacim" fill={TV_THEME.volume} barSize={3} name="Hacim" />
                    <Line type="monotone" yAxisId="price" dataKey="fiyat" stroke={TV_THEME.price} strokeWidth={2.5} dot={false} name="Fiyat" />
                    <Line 
                      type="monotone"
                      yAxisId="price"
                      dataKey="ma"
                      stroke={TV_THEME.ma}
                      strokeWidth={1.8}
                      dot={false}
                      name={`MA (${analizSonucu?.optimal_ma_periyodu})`} 
                    />
                    {hoveredDate && <ReferenceLine x={hoveredDate} stroke="rgba(148,163,184,0.65)" strokeDasharray="3 3" />}
                    <Brush dataKey="tarih" height={24} stroke={TV_THEME.price} travellerWidth={10} tickFormatter={xAxisFormatter} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* RSI GRAFİĞİ */}
              <div style={{ 
                background: `linear-gradient(180deg, ${TV_THEME.panel} 0%, #0b1220 100%)`, 
                borderRadius: "24px", 
                border: `1px solid ${TV_THEME.panelBorder}`, 
                padding: "25px",
                backdropFilter: "blur(10px)",
                boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.6), 0 14px 30px rgba(2,6,23,0.45)"
              }}>
                <h3 style={{ margin: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: TV_THEME.text }}>
                  <BarChart3 color={TV_THEME.rsi} /> RSI Oscillator
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={grafikVerisi}
                    syncId="analysis-sync"
                    onMouseMove={(state) => setHoveredDate(state?.activeLabel || null)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke={TV_THEME.grid} vertical={false} />
                    <XAxis dataKey="tarih" stroke={TV_THEME.textSoft} tick={{fontSize: 12}} tickFormatter={xAxisFormatter} />
                    <YAxis stroke={TV_THEME.textSoft} domain={[0, 100]} tick={{fontSize: 12}} />
                    <Tooltip 
                      labelFormatter={(value) => `Tarih: ${value}`}
                      contentStyle={{ background: "rgba(10, 15, 27, 0.95)", border: "1px solid rgba(71, 85, 105, 0.8)", borderRadius: "8px" }} 
                      itemStyle={{ color: TV_THEME.text }} 
                    />
                    <Legend wrapperStyle={{ color: TV_THEME.textSoft }} />
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke={TV_THEME.rsi} 
                      strokeWidth={2.2} 
                      dot={false} 
                      name={`RSI (${analizSonucu?.optimal_rsi_periyodu})`} 
                    />
                    {/* Aşırı alım/satım çizgileri */}
                    <Line 
                      type="monotone" 
                      dataKey={() => 70} 
                      stroke="#f87171" 
                      strokeDasharray="4 4" 
                      strokeWidth={1} 
                      dot={false} 
                      name="Aşırı Alım (70)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={() => 30} 
                      stroke="#4ade80" 
                      strokeDasharray="4 4" 
                      strokeWidth={1} 
                      dot={false} 
                      name="Aşırı Satım (30)" 
                    />
                    {hoveredDate && <ReferenceLine x={hoveredDate} stroke="rgba(148,163,184,0.65)" strokeDasharray="3 3" />}
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
                              setUygulananToplamAy(toplamAy);
                              setUygulananTestAy(testAy);
                              await analizGetir(toplamAy, testAy);
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
                          ({Math.max(uygulananToplam - uygulananTest, 0)} ay)
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
                          ({uygulananTest} ay)
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
