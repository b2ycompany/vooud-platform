import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importação de todas as páginas e componentes necessários
import PortalPage from './pages/PortalPage/PortalPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import StockOverviewPage from './pages/StockOverviewPage/StockOverviewPage'; // ADICIONADO: Import da nova página
import SplashScreen from './components/SplashScreen/SplashScreen';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const homePath = user.role === 'administrador' ? '/catalogo' : '/dashboard';
        return <Navigate to={homePath} replace />;
    }

    return <Outlet />;
};

const PublicRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    if (user?.role === 'administrador') {
        return <Navigate to="/catalogo" replace />;
    }
    
    if (user?.role === 'vendedor') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          <Route path="/" element={<PortalPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['administrador']} />}>
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/operacoes" element={<OperationsPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            {/* ADICIONADO: Nova rota para a Visão Geral de Estoque */}
            <Route path="/estoque-geral" element={<StockOverviewPage />} /> 
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;