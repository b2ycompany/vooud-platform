import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// --- CORREÇÃO 1: Importando o hook 'useAuth' ---
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
    // --- CORREÇÃO 2: Usando o hook 'useAuth' diretamente ---
    // Pega o usuário e o estado de carregamento do nosso hook
    const { user, loading } = useAuth();

    // Enquanto o estado de autenticação está sendo verificado, não renderiza nada
    // Isso evita um "piscar" da tela de login antes do redirecionamento
    if (loading) {
        return null; // Ou um componente de "Carregando..."
    }

    // Se não estiver carregando e houver um usuário, permite o acesso
    // Se não, redireciona para a página de login
    return user ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;