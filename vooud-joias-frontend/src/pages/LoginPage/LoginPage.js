import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const LoginPage = () => {
    const { loginUser, user } = useAuth(); // 'user' não é mais necessário para o redirecionamento aqui, mas pode ser útil
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
        // O redirecionamento agora é tratado pelo componente PublicRoute e pelo AuthContext.
        // Isso evita que a página pisque ou tente redirecionar antes do estado 'user' ser atualizado.
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">VOOUD</h2>
                {error && <p className="error-message">{error}</p>}
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