import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal/Modal';
import { addLead } from '../../services/leadService';
import './PortalPage.css';

const PortalPage = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOpenCatalog = () => setIsModalOpen(true);
    const handleFranchise = () => {
        // TODO: Navegar para uma futura página de franquia
        alert("Página 'Seja um Franqueado' em breve! Entre em contato para mais informações.");
    };

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const leadData = {
            nome: e.target.nome.value,
            email: e.target.email.value,
            whatsapp: e.target.whatsapp.value,
        };
        const result = await addLead(leadData);
        if (result.success) {
            setIsModalOpen(false);
            // TODO: Criar a página do catálogo público e navegar para ela
            alert("Obrigado pelo seu interesse! Entraremos em contato em breve.");
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="portal-container">
            <h1 className="portal-title">VOOUD</h1>
            <p className="portal-subtitle">Sua jornada em joias começa aqui</p>
            <div className="portal-cards">

                <div className="portal-card" onClick={handleOpenCatalog}>
                    <div className="card-content">
                        <span className="card-icon">💎</span>
                        <h3>Nosso Catálogo</h3>
                        <p>Explore nossas coleções exclusivas de joias.</p>
                    </div>
                </div>

                <div className="portal-card" onClick={() => navigate('/login')}>
                    <div className="card-content">
                        <span className="card-icon">🔑</span>
                        <h3>Acesso Restrito</h3>
                        <p>Login para Vendedores e Administradores.</p>
                    </div>
                </div>
                
                {/* O NOVO CARD, MAIS CHAMATIVO */}
                <div className="portal-card franchise-card" onClick={handleFranchise}>
                    <div className="card-content">
                        <span className="card-icon">👑</span>
                        <h3>Seja um Franqueado</h3>
                        <p>Leve o luxo e a exclusividade da VOOUD para sua cidade.</p>
                    </div>
                </div>

                <div className="portal-card" onClick={() => navigate('/cadastro')}>
                    <div className="card-content">
                        <span className="card-icon">✍️</span>
                        <h3>Seja um Revendedor</h3>
                        <p>Faça seu cadastro para ter um quiosque em sua loja.</p>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title="Acesse nosso Catálogo">
                <form onSubmit={handleLeadSubmit} className="lead-form">
                    <p>Deixe seu contato para ser o primeiro a receber novidades e acesso exclusivo ao nosso catálogo virtual.</p>
                    {error && <p className="error-message">{error}</p>}
                    <input type="text" name="nome" placeholder="Seu nome" required />
                    <input type="email" name="email" placeholder="Seu melhor e-mail" required />
                    <input type="text" name="whatsapp" placeholder="WhatsApp (Opcional)" />
                    <div className="form-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-button">Fechar</button>
                        <button type="submit" className="save-button" disabled={loading}>
                            {loading ? 'Enviando...' : 'Quero Acesso!'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PortalPage;