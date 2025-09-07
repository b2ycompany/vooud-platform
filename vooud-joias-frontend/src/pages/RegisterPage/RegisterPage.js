import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; // 1. Importar nossa instância
import '../../styles/Auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);

    try {
      const userData = {
        email: email,
        nome_completo: nomeCompleto,
        password: password,
        password2: confirmPassword,
      };

      // 2. Usar axiosInstance e a URL relativa
      const response = await axiosInstance.post('/api/accounts/register/', userData);

      setSuccess(response.data.message + ' Redirecionando para login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (apiError) {
      if (apiError.response && apiError.response.data && typeof apiError.response.data === 'object') {
        const errorData = apiError.response.data;
        const errorMessages = Object.keys(errorData).map(key => {
          const messages = errorData[key];
          return `${key}: ${messages.join(', ')}`;
        }).join(' ');
        setError(errorMessages || 'Ocorreu um erro ao tentar cadastrar.');
      } else {
        setError('Não foi possível conectar ao servidor ou ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      if (!success) {
          setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Criar Conta</h2>
        {success && <p style={{ color: 'lightgreen', textAlign: 'center' }}>{success}</p>}
        {error && <p style={{ color: 'tomato', textAlign: 'center' }}>{error}</p>}
        <div className="input-group">
          <input type="text" className="input-field" placeholder="Nome Completo" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} required />
        </div>
        <div className="input-group">
          <input type="email" className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <input type="password" className="input-field" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="input-group">
          <input type="password" className="input-field" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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