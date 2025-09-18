import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css'; // Importando o nosso novo CSS

const AdminLayout = ({ title, children }) => {
    const { logoutUser, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/');
    };

    const homeLink = user?.role === 'administrador' ? '/catalogo' : '/dashboard';

    return (
        <div className="admin-layout-container">
            <header className="admin-layout-header">
                <div className="header-top-bar">
                    <NavLink to={homeLink} className="header-title-link">
                        <h1>{title}</h1>
                    </NavLink>
                    <div className="header-user-info">
                        <span>Olá, {user?.nome || user?.email}</span>
                        <button onClick={handleLogout} className="logout-button">Sair</button>
                    </div>
                </div>
                
                {user?.role === 'administrador' && (
                    <nav className="admin-nav">
                        <NavLink 
                            to="/catalogo" 
                            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
                        >
                            Catálogo
                        </NavLink>
                        <NavLink 
                            to="/operacoes" 
                            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
                        >
                            Operações
                        </NavLink>
                        <NavLink 
                            to="/relatorios" 
                            className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}
                        >
                            Relatórios
                        </NavLink>
                    </nav>
                )}
            </header>
            <main className="admin-layout-content">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;