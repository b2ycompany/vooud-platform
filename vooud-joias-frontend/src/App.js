import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importações de páginas
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import SplashScreen from './components/SplashScreen/SplashScreen';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return <SplashScreen />;
    if (!user) return <Navigate to="/" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Se o usuário não tem a role permitida, redireciona para a página principal dele
        return <Navigate to={user.role === 'administrador' ? '/catalogo' : '/dashboard'} replace />;
    }
    return <Outlet />;
};

const PublicRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <SplashScreen />;
    if (user?.role === 'administrador') return <Navigate to="/catalogo" replace />;
    if (user?.role === 'vendedor') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas (Login, Cadastro) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
          </Route>

          {/* Rotas de Vendedor */}
          <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Rotas de Administrador */}
          <Route element={<PrivateRoute allowedRoles={['administrador']} />}>
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/operacoes" element={<OperationsPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
          </Route>
          
          {/* Rota Padrão para qualquer outro caminho */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;