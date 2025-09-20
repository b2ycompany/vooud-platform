import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify'; // ADICIONADO: Import do toast
import '../../styles/Auth.css';

const RegisterPage = () => {
    const { registerUser } = useAuth();
    const navigate = useNavigate();
    // REMOVIDO: const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nome = event.target.nomeCompleto.value;
        const email = event.target.email.value;
        const password = event.target.password.value;
        const confirmPassword = event.target.confirmPassword.value;
        const enderecoLoja = event.target.enderecoLoja.value;

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.'); // ALTERADO: Usa toast para exibir o erro
            return;
        }

        setLoading(true);
        try {
            const result = await registerUser(email, password, nome, enderecoLoja);
            if (result.success) {
                // ALTERADO: Substitui o 'alert' por um toast de sucesso mais elegante
                toast.success('Cadastro realizado com sucesso! Sua conta será ativada por um administrador.');
                navigate('/');
            } else {
                toast.error(result.error); // ALTERADO: Usa toast para exibir o erro
            }
        } catch (err) {
            toast.error('Ocorreu um erro inesperado durante o cadastro.'); // ALTERADO
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">Criar Conta</h2>
                {/* REMOVIDO: A exibição da mensagem de erro que ficava aqui */}
                <div className="input-group">
                    <input type="text" name="nomeCompleto" className="input-field" placeholder="Nome Completo" required />
                </div>
                <div className="input-group">
                    <input type="text" name="enderecoLoja" className="input-field" placeholder="Endereço da Loja" required />
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
                    <p>Já tem uma conta? <Link to="/login" className="auth-switch-link">Faça Login</Link></p>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;