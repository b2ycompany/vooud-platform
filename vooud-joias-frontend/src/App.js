import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importação das páginas
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage'; // Rota de cadastro
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import SplashScreen from './components/SplashScreen/SplashScreen'; // Um componente de loading é útil

/**
 * Componente para proteger rotas.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />; // Mostra uma tela de carregamento enquanto verifica o auth
    }

    return user ? children : <Navigate to="/" />; // Alterado para a rota raiz/login
};

/**
 * Componente para redirecionar usuários já logados.
 * Evita que um usuário logado acesse as páginas de login/cadastro.
 */
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />;
    }

    // Redireciona para a página apropriada com base na role se o usuário já estiver logado
    if (user) {
        if (user.role === 'admin') {
            return <Navigate to="/catalogo" />;
        }
        return <Navigate to="/dashboard" />;
    }

    return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas: Login e Cadastro */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/cadastro" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />

          {/* Rotas Protegidas (exigem autenticação) */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/catalogo" 
            element={
              <PrivateRoute>
                <CatalogPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/operacoes" 
            element={
              <PrivateRoute>
                <OperationsPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <PrivateRoute>
                <ReportsPage />
              </PrivateRoute>
            } 
          />

          {/* Rota Padrão: redireciona para a rota raiz */}
          <Route 
            path="*" 
            element={<Navigate to="/" />} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;