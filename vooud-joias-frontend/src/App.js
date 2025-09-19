import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importação de todas as páginas e componentes necessários
import PortalPage from './pages/PortalPage/PortalPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import SplashScreen from './components/SplashScreen/SplashScreen';

/**
 * Componente para proteger rotas. Apenas usuários autenticados e com a 'role' correta podem acessar.
 * Redireciona para a página inicial se não estiver logado.
 */
const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />; // Mostra uma tela de carregamento enquanto verifica a autenticação
    }

    // Se não houver usuário, redireciona para a página inicial (Portal)
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Se a rota exige uma 'role' específica e o usuário não a tem, redireciona para a página principal da sua role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const homePath = user.role === 'administrador' ? '/catalogo' : '/dashboard';
        return <Navigate to={homePath} replace />;
    }

    // Se passou por todas as verificações, permite o acesso à rota filha
    return <Outlet />;
};

/**
 * Componente para rotas públicas (Login, Cadastro).
 * Se o usuário já estiver logado, ele é redirecionado para o seu respectivo painel.
 */
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

    // Se não estiver logado ou não tiver uma role definida, permite o acesso à rota filha (Login/Cadastro)
    return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Raiz Pública: agora é o novo Portal de Acesso */}
          <Route path="/" element={<PortalPage />} />

          {/* Rotas Públicas que redirecionam se o usuário já estiver logado */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
          </Route>

          {/* Rotas de Vendedor: apenas usuários com role 'vendedor' podem acessar */}
          <Route element={<PrivateRoute allowedRoles={['vendedor']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Rotas de Administrador: apenas usuários com role 'administrador' podem acessar */}
          <Route element={<PrivateRoute allowedRoles={['administrador']} />}>
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/operacoes" element={<OperationsPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
          </Route>
          
          {/* Rota Padrão: qualquer outro caminho não encontrado redireciona para o Portal */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;