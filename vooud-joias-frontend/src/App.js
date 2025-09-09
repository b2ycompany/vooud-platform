import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // Ajuste o caminho se necessário

// Importação das suas páginas
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage'; // A nova página de relatórios

/**
 * Componente para proteger rotas.
 * Se o usuário não estiver logado, ele é redirecionado para a página de login.
 */
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Usando o hook do seu contexto de autenticação

    if (loading) {
        // Mostra uma mensagem de "carregando" enquanto verifica a autenticação
        return <div>Verificando autenticação...</div>;
    }

    // Se não houver usuário, redireciona para o login
    return user ? children : <Navigate to="/login" />;
};

/**
 * Componente para proteger a rota de login.
 * Se o usuário já estiver logado, ele é redirecionado para o dashboard.
 */
const LoginRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Verificando autenticação...</div>;
    }

    return !user ? children : <Navigate to="/dashboard" />;
};


function App() {
  return (
    // O AuthProvider envolve toda a aplicação para que o contexto seja acessível
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública para Login */}
          <Route 
            path="/login" 
            element={
              <LoginRoute>
                <LoginPage />
              </LoginRoute>
            } 
          />

          {/* Rotas protegidas que exigem autenticação */}
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

          {/* Rota padrão: redireciona para o dashboard se logado, ou para o login se não */}
          <Route 
            path="*" 
            element={<Navigate to="/dashboard" />} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;