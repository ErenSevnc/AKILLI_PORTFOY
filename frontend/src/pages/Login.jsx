import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const cevap = await axios.post('http://127.0.0.1:8000/api/auth/login', { email, sifre });
      login(cevap.data.token, cevap.data.kullanici);
      navigate('/portfolio');
    } catch (error) {
      setHata(error.response?.data?.detail || 'Giriş yapılamadı');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '110px', color: 'white', position: 'relative', overflowX: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ maxWidth: '460px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid #334155', borderRadius: '18px', padding: '28px' }}>
          <h1 style={{ marginTop: 0 }}>Giriş Yap</h1>
          <p style={{ color: '#94a3b8', marginTop: '-6px' }}>Portföyünü görmek için hesabına gir.</p>

          {hata && (
            <div style={{ background: 'rgba(127, 29, 29, 0.65)', border: '1px solid #7f1d1d', color: '#fecaca', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
              {hata}
            </div>
          )}

          <form onSubmit={girisYap} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" disabled={yukleniyor} style={buttonStyle(yukleniyor)}>
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <p style={{ color: '#94a3b8', marginTop: '14px', marginBottom: 0 }}>
            Hesabın yok mu? <Link to="/register" style={{ color: '#38bdf8' }}>Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
};

const buttonStyle = (disabled) => ({
  marginTop: '4px',
  border: 'none',
  borderRadius: '10px',
  padding: '12px',
  fontWeight: 'bold',
  background: disabled ? '#334155' : '#38bdf8',
  color: disabled ? '#94a3b8' : '#0f172a',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

export default Login;
