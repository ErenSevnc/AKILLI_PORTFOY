import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Analysis from './pages/Analysis';
import News from './pages/News';
import OptimizasyonDogrulama from './pages/OptimizasyonDogrulama';
import RsiMaRehberi from './pages/RsiMaRehberi';
import Login from './pages/Login';
import Register from './pages/Register';
import { CurrencyProvider } from './CurrencyContext';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Navbar />
        <Routes>
          <Route path="/dogrulama" element={<OptimizasyonDogrulama />} />
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/rsi-ma-rehberi" element={<RsiMaRehberi />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
