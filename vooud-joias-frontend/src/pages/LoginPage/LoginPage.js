import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify'; // ADICIONADO: Import do toast
import '../../styles/Auth.css';

const LoginPage = () => {
    const { loginUser } = useAuth();
    // REMOVIDO: const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const email = event.target.email.value;
        const password = event.target.password.value;
        const result = await loginUser(email, password);
        
        setLoading(false);
        
        if (result.error) {
            toast.error(result.error); // ALTERADO: Usa toast para exibir o erro
        }
        // O redirecionamento é tratado pelo AuthContext e App.js, então não há 'toast.success' aqui.
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">VOOUD</h2>
                {/* REMOVIDO: A exibição da mensagem de erro que ficava aqui */}
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