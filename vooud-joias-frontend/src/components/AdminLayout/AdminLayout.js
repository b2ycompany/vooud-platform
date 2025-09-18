import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ title, children }) => {
    const { logoutUser, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/'); // Redireciona para a página de login após o logout
    };

    return (
        <div className="admin-layout-container">
            <header className="admin-layout-header">
                <div className="header-top-bar">
                    <NavLink to={user?.role === 'administrador' ? '/catalogo' : '/dashboard'} className="nav-button back-button">
                         &larr; Voltar
                    </NavLink>
                    <h1>{title}</h1>
                    <button onClick={handleLogout} className="logout-button">Sair</button>
                </div>
                {/* A navegação do administrador só é visível para ele */}
                {user?.role === 'administrador' && (
                    <nav className="admin-nav">
                        <NavLink to="/catalogo" className="admin-nav-link">
                            Catálogo
                        </NavLink>
                        <NavLink to="/operacoes" className="admin-nav-link">
                            Operações
                        </NavLink>
                        <NavLink to="/relatorios" className="admin-nav-link">
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