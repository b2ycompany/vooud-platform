import React, { useState, useEffect } from 'react'; // 1. Re-importar useState e useEffect
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './utils/PrivateRoute';

import SplashScreen from './components/SplashScreen/SplashScreen'; // 2. Re-importar a SplashScreen
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';

function App() {
  // 3. Re-adicionar os estados para controlar a splash screen
  const [loading, setLoading] = useState(true);

  // 4. Re-adicionar o efeito para esconder a splash screen após um tempo
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 5500); // 5.5 segundos de exibição
  }, []);

  // 5. Lógica de renderização condicional
  // Se estiver carregando, exibe a SplashScreen
  if (loading) {
    return <SplashScreen />;
  }

  // Se não estiver carregando, exibe o aplicativo principal com as rotas
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          
          {/* Rotas Privadas */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;