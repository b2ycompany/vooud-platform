import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importação das páginas
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import OperationsPage from './pages/OperationsPage/OperationsPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import SplashScreen from './components/SplashScreen/SplashScreen';

// Componente para proteger rotas (exige apenas autenticação)
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <SplashScreen />;
    }
    return user ? children : <Navigate to="/" />;
};

// Componente para rotas exclusivas do administrador
const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <SplashScreen />;
    }
    // Verifica se o usuário está logado E se ele é um administrador.
    // Se não for, redireciona para a tela de vendas do vendedor.
    return (user && user.role === 'administrador') ? children : <Navigate to="/dashboard" />;
};

// Componente para redirecionar usuários já logados
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <SplashScreen />;
    }
    if (user) {
        // Redireciona com base na função do usuário
        if (user.role === 'administrador') {
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

          {/* Rota para Vendedores (protegida apenas por login) */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } 
          />

          {/* Rotas de Administrador (protegidas por AdminRoute) */}
          <Route 
            path="/catalogo" 
            element={
              <AdminRoute>
                <CatalogPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/operacoes" 
            element={
              <AdminRoute>
                <OperationsPage />
              </AdminRoute>
            } 
          />
          <Route 
            path="/relatorios" 
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            } 
          />

          {/* Rota Padrão: redireciona para a rota raiz se a URL não existir */}
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