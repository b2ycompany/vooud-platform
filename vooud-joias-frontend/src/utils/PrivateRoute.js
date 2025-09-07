import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = () => {
    // Pega o usuário do nosso contexto de autenticação
    const { user } = useContext(AuthContext);

    // Se houver um usuário, permite o acesso à rota filha (Outlet)
    // Se não, redireciona para a página de login ('/')
    return user ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;