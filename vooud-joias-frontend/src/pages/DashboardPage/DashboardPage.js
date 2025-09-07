import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import './DashboardPage.css';

const DashboardPage = () => {
    const { logoutUser, user } = useContext(AuthContext);

    // Estados para o PDV
    const [quiosqueInfo, setQuiosqueInfo] = useState(null);
    const [carrinho, setCarrinho] = useState([]);
    const [cliente, setCliente] = useState({ nome: '', email: '', whatsapp: '' });
    const [metodoPagamento, setMetodoPagamento] = useState('PIX');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Efeito para buscar o inventário quando a página carrega
    useEffect(() => {
        const fetchInventario = async () => {
            try {
                const response = await axiosInstance.get('/api/operations/meu-quiosque/inventario/');
                setQuiosqueInfo(response.data);
            } catch (err) {
                setError('Não foi possível carregar o inventário. Verifique se você está associado a um quiosque.');
            }
        };
        fetchInventario();
    }, []);

    const adicionarAoCarrinho = (itemInventario) => {
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.joia.id === itemInventario.joia.id);
            if (itemExistente) {
                // Se o item já está no carrinho, aumenta a quantidade, respeitando o estoque
                const novaQuantidade = itemExistente.quantidade + 1;
                if (novaQuantidade > itemInventario.quantidade) {
                    alert(`Estoque máximo para ${itemInventario.joia.nome} atingido!`);
                    return prevCarrinho;
                }
                return prevCarrinho.map(item =>
                    item.joia.id === itemInventario.joia.id ? { ...item, quantidade: novaQuantidade } : item
                );
            }
            // Se não, adiciona o novo item ao carrinho
            return [...prevCarrinho, { ...itemInventario, quantidade: 1 }];
        });
    };
    
    const calcularTotalCarrinho = () => {
        return carrinho.reduce((total, item) => total + (item.joia.preco_venda * item.quantidade), 0).toFixed(2);
    };

    const finalizarVenda = async (e) => {
        e.preventDefault();
        if (carrinho.length === 0) {
            setError("O carrinho está vazio.");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        const vendaData = {
            quiosque: quiosqueInfo.quiosque_id,
            cliente: cliente,
            metodo_pagamento: metodoPagamento,
            desconto: 0.00, // Lógica de desconto pode ser adicionada aqui
            itens: carrinho.map(item => ({
                joia_id: item.joia.id,
                quantidade: item.quantidade
            }))
        };

        try {
            const response = await axiosInstance.post('/api/operations/vendas/', vendaData);
            setSuccess(response.data.message);
            // Limpa o estado e recarrega o inventário
            setCarrinho([]);
            setCliente({ nome: '', email: '', whatsapp: '' });
            const res = await axiosInstance.get('/api/operations/meu-quiosque/inventario/');
            setQuiosqueInfo(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao finalizar a venda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>VOOUD PDV</h1>
                {user && <span>Olá, {user.first_name}</span>}
                <button onClick={logoutUser} className="logout-button">Sair</button>
            </header>
            <main className="pdv-grid">
                <div className="pdv-inventario">
                    <h3>Inventário do Quiosque: {quiosqueInfo?.identificador}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <div className="inventario-lista">
                        {quiosqueInfo?.inventario.map(item => (
                            <div key={item.id} className="inventario-item" onClick={() => adicionarAoCarrinho(item)}>
                                <p>{item.joia.nome} ({item.joia.sku})</p>
                                <p>Estoque: {item.quantidade}</p>
                                <p>R$ {item.joia.preco_venda}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pdv-venda">
                    <h3>Nova Venda</h3>
                    {success && <p className="success-message">{success}</p>}
                    <form onSubmit={finalizarVenda}>
                        <div className="carrinho-secao">
                            <h4>Carrinho</h4>
                            {carrinho.length === 0 ? <p>Adicione itens do inventário.</p> :
                                carrinho.map(item => (
                                    <div key={item.joia.id} className="carrinho-item">
                                        <span>{item.quantidade}x {item.joia.nome}</span>
                                        <span>R$ {(item.joia.preco_venda * item.quantidade).toFixed(2)}</span>
                                    </div>
                                ))
                            }
                            <hr />
                            <div className="carrinho-total">
                                <strong>Total:</strong>
                                <strong>R$ {calcularTotalCarrinho()}</strong>
                            </div>
                        </div>

                        <div className="cliente-secao">
                            <h4>Dados do Cliente</h4>
                            <input type="text" placeholder="Nome do Cliente" value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} required />
                            <input type="email" placeholder="Email do Cliente" value={cliente.email} onChange={e => setCliente({...cliente, email: e.target.value})} required />
                            <input type="text" placeholder="WhatsApp (opcional)" value={cliente.whatsapp} onChange={e => setCliente({...cliente, whatsapp: e.target.value})} />
                        </div>
                        
                        <div className="pagamento-secao">
                            <h4>Pagamento</h4>
                            <select value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)}>
                                <option value="PIX">Pix</option>
                                <option value="CC">Cartão de Crédito</option>
                                <option value="CD">Cartão de Débito</option>
                                <option value="DIN">Dinheiro</option>
                            </select>
                        </div>

                        <button type="submit" className="finalizar-venda-button" disabled={loading}>
                            {loading ? 'Processando...' : 'Finalizar Venda'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;