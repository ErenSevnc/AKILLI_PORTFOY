import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const kayitOl = async (e) => {
    e.preventDefault();

    if (sifre !== sifreTekrar) {
      setHata('Şifreler eşleşmiyor');
      return;
    }

    setHata('');
    setYukleniyor(true);

    try {
      const cevap = await axios.post('http://127.0.0.1:8000/api/auth/register', {
        email,
        kullanici_adi: kullaniciAdi,
        sifre,
      });
      login(cevap.data.token, cevap.data.kullanici);
      navigate('/portfolio');
    } catch (error) {
      setHata(error.response?.data?.detail || 'Kayıt oluşturulamadı');
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
          <h1 style={{ marginTop: 0 }}>Kayıt Ol</h1>
          <p style={{ color: '#94a3b8', marginTop: '-6px' }}>Yeni hesap oluşturup portföyünü kaydet.</p>

          {hata && (
            <div style={{ background: 'rgba(127, 29, 29, 0.65)', border: '1px solid #7f1d1d', color: '#fecaca', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
              {hata}
            </div>
          )}

          <form onSubmit={kayitOl} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value.toLowerCase())}
              style={inputStyle}
              minLength={3}
              maxLength={30}
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
            <input
              type="password"
              placeholder="Şifre (Tekrar)"
              value={sifreTekrar}
              onChange={(e) => setSifreTekrar(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" disabled={yukleniyor} style={buttonStyle(yukleniyor)}>
              {yukleniyor ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p style={{ color: '#94a3b8', marginTop: '14px', marginBottom: 0 }}>
            Hesabın var mı? <Link to="/login" style={{ color: '#38bdf8' }}>Giriş yap</Link>
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
  background: disabled ? '#334155' : '#4ade80',
  color: disabled ? '#94a3b8' : '#0f172a',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

export default Register;
