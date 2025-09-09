import React from 'react';
import { NavLink } from 'react-router-dom'; // Trocado para NavLink para estilizar o link ativo
import './AdminLayout.css';

const AdminLayout = ({ title, children }) => {
    return (
        <div className="admin-layout-container">
            <header className="admin-layout-header">
                <div className="header-top-bar">
                    <NavLink to="/dashboard" className="nav-button back-button">
                        &larr; Voltar ao PDV
                    </NavLink>
                    <h1>{title}</h1>
                </div>
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
            </header>
            <main className="admin-layout-content">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;