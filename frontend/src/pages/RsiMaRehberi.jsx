import { Link } from 'react-router-dom';
import { Activity, LineChart, ShieldAlert, CheckCircle2 } from 'lucide-react';

function RsiMaRehberi() {
  return (
    <div style={{
      minHeight: "100vh",
      paddingTop: "110px",
      paddingBottom: "60px",
      color: "white",
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
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 1 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(74, 222, 128, 0.12))",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "24px",
          padding: "40px 28px",
          marginBottom: "30px"
        }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)" }}>RSI ve MA Rehberi</h1>
          <p style={{ marginTop: "14px", color: "#cbd5e1", lineHeight: "1.7" }}>
            Bu sayfa RSI ve MA göstergelerinin ne olduğunu, nasıl yorumlandığını ve tek başına kullanıldığında
            hangi riskleri taşıdığını sade şekilde açıklar.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid #334155", borderRadius: "16px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <Activity color="#38bdf8" size={20} />
              <h3 style={{ margin: 0 }}>RSI Nedir?</h3>
            </div>
            <p style={{ color: "#cbd5e1", lineHeight: "1.65", margin: 0 }}>
              RSI (Relative Strength Index), fiyat hareketinin hızını ve gücünü 0-100 arasında ölçen bir momentum
              göstergesidir. Genelde 14 periyot kullanılır.
            </p>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid #334155", borderRadius: "16px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <LineChart color="#4ade80" size={20} />
              <h3 style={{ margin: 0 }}>MA Nedir?</h3>
            </div>
            <p style={{ color: "#cbd5e1", lineHeight: "1.65", margin: 0 }}>
              MA (Moving Average), fiyatın belirli bir dönem ortalamasını alarak trendi daha net görmeyi sağlar.
              Kısa MA daha hızlı, uzun MA daha sakin tepki verir.
            </p>
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid #334155", borderRadius: "16px", padding: "26px", marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>RSI Nasıl Okunur?</h2>
          <div style={{ color: "#cbd5e1", lineHeight: "1.8" }}>
            <p><strong>70 üzeri:</strong> Aşırı alım bölgesi olarak görülür, düzeltme riski artabilir.</p>
            <p><strong>30 altı:</strong> Aşırı satım bölgesi olarak görülür, tepki yükselişi gelebilir.</p>
            <p><strong>50 seviyesi:</strong> Momentumun nötr çizgisi gibi düşünülebilir.</p>
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid #334155", borderRadius: "16px", padding: "26px", marginBottom: "20px" }}>
          <h2 style={{ marginTop: 0 }}>MA Nasıl Kullanılır?</h2>
          <div style={{ color: "#cbd5e1", lineHeight: "1.8" }}>
            <p><strong>Fiyat MA üstündeyse:</strong> Trend görece güçlü kabul edilir.</p>
            <p><strong>Fiyat MA altındaysa:</strong> Zayıf görünüm sinyali olabilir.</p>
            <p><strong>Kısa ve uzun MA kesişimi:</strong> Trend değişimi ihtimalini gösterebilir (tek başına yeterli değildir).</p>
          </div>
        </div>

        <div style={{ background: "rgba(127, 29, 29, 0.22)", border: "1px solid rgba(248, 113, 113, 0.35)", borderRadius: "16px", padding: "22px", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <ShieldAlert color="#f87171" size={20} />
            <h3 style={{ margin: 0 }}>Önemli Uyarı</h3>
          </div>
          <p style={{ color: "#fecaca", margin: 0, lineHeight: "1.7" }}>
            RSI ve MA gecikmeli göstergelerdir. Tek bir sinyale göre işlem açmak yerine trend, hacim, haber akışı ve
            risk yönetimi birlikte değerlendirilmelidir.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link to="/analysis" style={{ textDecoration: "none" }}>
            <button style={{ padding: "12px 20px", borderRadius: "12px", border: "none", background: "#38bdf8", color: "#0f172a", fontWeight: "bold", cursor: "pointer" }}>
              Analiz Sayfasına Git
            </button>
          </Link>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button style={{ padding: "12px 20px", borderRadius: "12px", border: "1px solid #475569", background: "rgba(15,23,42,0.6)", color: "#e2e8f0", fontWeight: "bold", cursor: "pointer" }}>
              Ana Sayfaya Dön
            </button>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#86efac", marginLeft: "4px" }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: "0.95rem" }}>Yeni başlayanlar için hızlı özet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RsiMaRehberi;
