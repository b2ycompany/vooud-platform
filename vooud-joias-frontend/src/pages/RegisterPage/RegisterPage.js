import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const RegisterPage = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        const nome = event.target.nomeCompleto.value;
        const email = event.target.email.value;
        const password = event.target.password.value;
        const confirmPassword = event.target.confirmPassword.value;

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        
        setLoading(true);
        try {
            const result = await registerUser(email, password, nome);
            if (result.success) {
                alert('Cadastro realizado com sucesso! Você será redirecionado para a página de login.');
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado durante o cadastro.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">Criar Conta</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="input-group">
                    <input type="text" name="nomeCompleto" className="input-field" placeholder="Nome Completo" required />
                </div>
                <div className="input-group">
                    <input type="email" name="email" className="input-field" placeholder="Email" required />
                </div>
                <div className="input-group">
                    <input type="password" name="password" className="input-field" placeholder="Senha" required />
                </div>
                <div className="input-group">
                    <input type="password" name="confirmPassword" className="input-field" placeholder="Confirmar Senha" required />
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
                <div className="auth-switch">
                    <p>Já tem uma conta? <Link to="/" className="auth-switch-link">Faça Login</Link></p>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;