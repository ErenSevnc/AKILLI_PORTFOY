import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, ExternalLink, Globe, TrendingUp, Bitcoin, DollarSign, Pickaxe, Loader2, X } from 'lucide-react';
import { buildSearchIndex, normalizeSearchText } from '../utils/search';

function News() {
  const API_BASE = 'http://127.0.0.1:8000';
  const ILK_GOSTERIM_ADEDI = 3;
  const [aktifKategori, setAktifKategori] = useState('Tümü');
  const [aramaMetni, setAramaMetni] = useState('');
  const [haberler, setHaberler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [gosterilenAdet, setGosterilenAdet] = useState(ILK_GOSTERIM_ADEDI);
  const aktifSorgu = normalizeSearchText(aramaMetni);

  const kategoriPlaceholder = {
    Borsa: 'linear-gradient(135deg, #1d4ed8, #0f172a)',
    Kripto: 'linear-gradient(135deg, #f59e0b, #111827)',
    Döviz: 'linear-gradient(135deg, #0ea5e9, #1e293b)',
    Emtia: 'linear-gradient(135deg, #16a34a, #1f2937)',
    Tümü: 'linear-gradient(135deg, #1e293b, #0f172a)',
  };

  useEffect(() => {
    const veriCek = async () => {
      setYukleniyor(true);
      setHata('');

      try {
        const cevap = await axios.get('http://127.0.0.1:8000/api/haberler', {
          params: { limit: 60 },
        });
        const liste = Array.isArray(cevap.data) ? cevap.data : [];
        setHaberler(liste);
      } catch (error) {
        console.error('Haberler çekilemedi:', error);
        setHata(error.response?.data?.detail || 'Canlı haber servisine erişilemedi. Lütfen daha sonra tekrar dene.');
      } finally {
        setYukleniyor(false);
      }
    };

    veriCek();
  }, []);

  const kategoriler = [
    { isim: 'Tümü', ikon: <Globe size={18} /> },
    { isim: 'Borsa', ikon: <TrendingUp size={18} /> },
    { isim: 'Kripto', ikon: <Bitcoin size={18} /> },
    { isim: 'Döviz', ikon: <DollarSign size={18} /> },
    { isim: 'Emtia', ikon: <Pickaxe size={18} /> },
  ];

  const formatRelative = (unix) => {
    if (!unix) return 'Tarih yok';

    const nowSec = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, nowSec - unix);

    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;

    return new Date(unix * 1000).toLocaleDateString('tr-TR');
  };

  const filtrelenmisHaberler = useMemo(() => {
    const sorgu = normalizeSearchText(aramaMetni);

    return haberler.filter((h) => {
      const kategoriUyumu = aktifKategori === 'Tümü' || h.kategori === aktifKategori;
      if (!sorgu) {
        return kategoriUyumu;
      }

      const aramaUyumu = buildSearchIndex([
        h.baslik,
        h.ozet,
        h.kaynak,
        h.kategori,
      ]).includes(sorgu);

      return kategoriUyumu && aramaUyumu;
    });
  }, [haberler, aktifKategori, aramaMetni]);

  useEffect(() => {
    setGosterilenAdet(ILK_GOSTERIM_ADEDI);
  }, [aktifKategori, aramaMetni]);

  const proxyResimUrl = (url) => {
    if (!url) return '';
    return `${API_BASE}/api/haber-resim?url=${encodeURIComponent(url)}`;
  };

  const handleHaberGorselHata = (event, orijinalUrl) => {
    const img = event.currentTarget;
    if (!img.dataset.fallbackDenendi && orijinalUrl) {
      img.dataset.fallbackDenendi = '1';
      img.src = orijinalUrl;
      return;
    }
    img.style.display = 'none';
  };

  const gosterilenHaberler = filtrelenmisHaberler.slice(0, gosterilenAdet);
  const dahaFazlaVar = filtrelenmisHaberler.length > gosterilenAdet;

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px', color: 'white', display: 'flex', justifyContent: 'center', position: 'relative', overflowX: 'hidden' }}>
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
      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Piyasa Haberleri</h1>
          <p style={{ color: '#94a3b8' }}>Yahoo Finance kaynaklı güncel piyasa haber akışı</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '30px', background: '#1e293b', padding: '15px', borderRadius: '16px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {kategoriler.map((kat) => (
              <button
                key={kat.isim}
                onClick={() => setAktifKategori(kat.isim)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                  background: aktifKategori === kat.isim ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                  color: aktifKategori === kat.isim ? '#0f172a' : '#94a3b8',
                  transition: 'all 0.2s',
                }}
              >
                {kat.ikon} {kat.isim}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={20} />
            <input
              type="text"
              placeholder="Haber başlığında ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAramaMetni('');
                }
              }}
              aria-label="Haberlerde ara"
              style={{ width: '100%', padding: '12px 42px 12px 45px', background: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}
            />
            {aramaMetni && (
              <button
                type="button"
                onClick={() => setAramaMetni('')}
                aria-label="Aramayı temizle"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {aktifSorgu && (
          <div style={{ marginBottom: '18px', color: '#94a3b8', fontSize: '0.95rem' }}>
            "{aramaMetni.trim()}" için {filtrelenmisHaberler.length} haber bulundu.
          </div>
        )}

        {yukleniyor && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: '#94a3b8', marginBottom: '20px' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Haberler yükleniyor...
          </div>
        )}

        {hata && (
          <div style={{ marginBottom: '20px', background: 'rgba(127,29,29,0.4)', border: '1px solid #7f1d1d', color: '#fecaca', padding: '12px', borderRadius: '10px' }}>
            {hata}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
          {gosterilenHaberler.map((haber, index) => (
            <div key={`${haber.id}-${index}`} style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative', background: kategoriPlaceholder[haber.kategori] || kategoriPlaceholder.Tümü }}>
                {haber.resim ? (
                  <img
                    src={proxyResimUrl(haber.resim)}
                    alt="haber"
                    onError={(e) => handleHaberGorselHata(e, haber.resim)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontWeight: 'bold' }}>
                    {haber.kategori || 'Piyasa'} Haberi
                  </div>
                )}
                <span style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', color: '#38bdf8', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>
                  {haber.kategori}
                </span>
              </div>

              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{haber.kaynak}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {formatRelative(haber.tarih_unix)}</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', lineHeight: '1.4', color: '#f1f5f9' }}>{haber.baslik}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', flex: '1' }}>{haber.ozet}</p>

                <a
                  href={haber.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button style={{ width: '100%', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Kaynağa Git <ExternalLink size={16} />
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {!yukleniyor && !hata && dahaFazlaVar && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
            <button
              onClick={() => setGosterilenAdet((prev) => prev + ILK_GOSTERIM_ADEDI)}
              style={{
                padding: '12px 22px',
                borderRadius: '10px',
                border: '1px solid #334155',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Daha Fazla Göster
            </button>
          </div>
        )}

        {!yukleniyor && filtrelenmisHaberler.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
            <Filter size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
            <h3>Sonuç Bulunamadı</h3>
            <p>Bu filtreye uygun haber yok veya kaynak geçici olarak boş döndü.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default News;
