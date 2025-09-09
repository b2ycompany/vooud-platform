import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // Importar Link
import AuthContext from '../../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
    const { logoutUser, user } = useContext(AuthContext);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>VOOUD Joias</h1>
                <div>
                    {user && <span>Olá, {user.nome || user.email}</span>}
                    <button onClick={logoutUser} className="logout-button">Sair</button>
                </div>
            </header>
            <main className="dashboard-content">
                <h2>Bem-vindo ao seu Dashboard!</h2>
                
                {/* Link que só aparece para administradores */}
                {user && user.role === 'admin' && (
                    <div className="admin-section">
                        <h3>Painel do Administrador</h3>
                        <Link to="/catalogo" className="admin-link">Gerenciar Catálogo</Link>
                        {/* Adicionaremos mais links aqui no futuro */}
                    </div>
                )}

                <div className="vendedor-section">
                     <h3>Ponto de Venda</h3>
                     <p>Aqui ficará a interface de vendas para o seu quiosque.</p>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;