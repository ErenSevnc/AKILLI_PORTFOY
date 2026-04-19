import { Link } from 'react-router-dom';
import CurrencySelector from './CurrencySelector';
import { useAuth } from '../useAuth';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav style={{ 
      padding: "20px 40px", 
      background: "rgba(0,0,0,0.3)", 
      backdropFilter: "blur(5px)",
      color: "white", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      position: "fixed",
      width: "100%",
      top: 0,
      zIndex: 1000,
      boxSizing: "border-box"
    }}>
      <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Akıllı Portföy</h2>
      
      <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "30px" }}>
          <Link to="/" style={{ color: "#e2e8f0", fontWeight: "500", textDecoration: "none" }}>Ana Sayfa</Link>
          <Link to="/portfolio" style={{ color: "#e2e8f0", fontWeight: "500", textDecoration: "none" }}>Portföyüm</Link>
          <Link to="/analysis" style={{ color: "#e2e8f0", fontWeight: "500", textDecoration: "none" }}>Analiz</Link>
          <Link to="/dogrulama" style={{ color: "#e2e8f0", fontWeight: "500", textDecoration: "none" }}>Doğrulama</Link>
          <Link to="/news" style={{ color: "#e2e8f0", fontWeight: "500", textDecoration: "none" }}>Haberler</Link>
        </div>

        {/* Para Birimi Seçici */}
        <CurrencySelector />
        
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#cbd5e1", fontSize: "0.9rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
              @{user?.username || user?.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "10px 16px",
                background: "#ef4444",
                border: "none",
                borderRadius: "20px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Çıkış Yap
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "10px 16px",
                background: "#38bdf8",
                border: "none",
                borderRadius: "20px",
                color: "#0f172a",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
                Giriş Yap
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "10px 16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "20px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}>
                Kayıt Ol
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
