import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// --- CORREÇÃO 1: Importando o hook 'useAuth' ---
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const LoginPage = () => {
    // --- CORREÇÃO 2: Usando o hook 'useAuth' diretamente ---
    const { loginUser, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        const email = event.target.email.value;
        const password = event.target.password.value;
        const result = await loginUser(email, password);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        }
    };
    
    // Efeito para redirecionar se o usuário já estiver logado
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">VOOUD</h2>
                {error && <p style={{ color: 'tomato', textAlign: 'center' }}>{error}</p>}
                <div className="input-group">
                    <input type="email" name="email" className="input-field" placeholder="Email" required />
                </div>
                <div className="input-group">
                    <input type="password" name="password" className="input-field" placeholder="Senha" required />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <div className="auth-switch">
                    <p>Não tem uma conta? <Link to="/cadastro" className="auth-switch-link">Cadastre-se</Link></p>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;