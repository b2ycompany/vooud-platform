import React, { useContext, useState } from 'react'; // A correção está aqui: adicionamos o 'useState'
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import '../../styles/Auth.css';

const LoginPage = () => {
    // Pegamos a função de login e o estado de loading do nosso contexto
    const { loginUser, loading } = useContext(AuthContext);
    
    // Agora o useState está importado e esta linha funcionará
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        
        const email = event.target.email.value;
        const password = event.target.password.value;
        
        // A função loginUser agora retorna uma mensagem de erro se falhar
        const errorMessage = await loginUser(email, password);
        
        if (errorMessage) {
            setError(errorMessage);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">VOOUD</h2>
                
                {/* A exibição de erro continua a mesma */}
                {error && <p style={{ color: 'tomato', textAlign: 'center' }}>{error}</p>}

                <div className="input-group">
                    {/* Usamos 'name' para pegar os valores facilmente com event.target */}
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