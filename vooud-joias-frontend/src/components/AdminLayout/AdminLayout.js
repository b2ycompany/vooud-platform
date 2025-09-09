import React from 'react';
import { Link } from 'react-router-dom';
import './AdminLayout.css';

// Este componente recebe um título e "filhos" (o conteúdo da página) como propriedades
const AdminLayout = ({ title, children }) => {
    return (
        <div className="admin-layout-container">
            <header className="admin-layout-header">
                {/* O botão "Voltar" que leva para o dashboard principal */}
                <Link to="/dashboard" className="back-button">
                    &larr; Voltar ao Dashboard
                </Link>
                <h1>{title}</h1>
            </header>
            <main className="admin-layout-content">
                {children} {/* Aqui será renderizado o conteúdo específico de cada página */}
            </main>
        </div>
    );
};

export default AdminLayout;