import React, { useContext, useState, useEffect, useCallback } from 'react';
// O 'useNavigate' foi removido da linha abaixo
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import './DashboardPage.css';

const DashboardPage = () => {
    const { logoutUser, user } = useContext(AuthContext);

    const [inventario, setInventario] = useState([]);
    const [quiosque, setQuiosque] = useState(null);
    const [carrinho, setCarrinho] = useState([]);
    const [cliente, setCliente] = useState({ nome: '', email: '', whatsapp: '' });
    const [metodoPagamento, setMetodoPagamento] = useState('PIX');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const qQuiosque = query(collection(db, "quiosques"), where("vendedorResponsavelId", "==", user.uid));
            const quiosqueSnapshot = await getDocs(qQuiosque);

            if (quiosqueSnapshot.empty) {
                setError('Nenhum quiosque associado a este vendedor.');
                setLoading(false);
                return;
            }
            const quiosqueData = { id: quiosqueSnapshot.docs[0].id, ...quiosqueSnapshot.docs[0].data() };
            setQuiosque(quiosqueData);

            const qInventario = query(collection(db, "inventario"), where("quiosqueId", "==", quiosqueData.id), where("quantidade", ">", 0));
            const inventarioSnapshot = await getDocs(qInventario);
            const inventarioItems = inventarioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (inventarioItems.length === 0) {
                setInventario([]);
                return;
            }
            
            const joiaIds = inventarioItems.map(item => item.joiaId);
            const qJoias = query(collection(db, "joias"), where("__name__", "in", joiaIds));
            const joiasSnapshot = await getDocs(qJoias);
            const joiasData = joiasSnapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = { id: doc.id, ...doc.data() };
                return acc;
            }, {});

            const inventarioCompleto = inventarioItems.map(item => ({
                ...item,
                joia: joiasData[item.joiaId]
            }));

            setInventario(inventarioCompleto);
        } catch (err) {
            console.error("Erro detalhado:", err);
            setError('Não foi possível carregar o inventário.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const adicionarAoCarrinho = (itemInventario) => {
        setSuccess('');
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.id === itemInventario.id);
            const estoqueDisponivel = inventario.find(i => i.id === itemInventario.id)?.quantidade || 0;

            if (itemExistente) {
                const novaQuantidade = itemExistente.quantidade + 1;
                if (novaQuantidade > estoqueDisponivel) {
                    setError(`Estoque máximo para ${itemInventario.joia.nome} atingido!`);
                    return prevCarrinho;
                }
                setError('');
                return prevCarrinho.map(item =>
                    item.id === itemInventario.id ? { ...item, quantidade: novaQuantidade } : item
                );
            }
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

        try {
            await runTransaction(db, async (transaction) => {
                const vendaRef = doc(collection(db, "vendas"));
                let totalVendaBruto = 0;
                let totalCusto = 0;
                let totalComissao = 0;

                const updates = [];
                for (const itemCarrinho of carrinho) {
                    const inventarioRef = doc(db, "inventario", itemCarrinho.id);
                    const inventarioDoc = await transaction.get(inventarioRef);

                    if (!inventarioDoc.exists() || inventarioDoc.data().quantidade < itemCarrinho.quantidade) {
                        throw new Error(`Estoque insuficiente para a joia ${itemCarrinho.joia.nome}.`);
                    }
                    
                    const novaQuantidade = inventarioDoc.data().quantidade - itemCarrinho.quantidade;
                    updates.push({ ref: inventarioRef, novaQuantidade });
                }

                let clienteId = null;
                if (cliente.email) {
                    const qCliente = query(collection(db, "clientes"), where("email", "==", cliente.email));
                    const clienteSnapshot = await getDocs(qCliente);
                    if (clienteSnapshot.empty) {
                        const novoClienteRef = await addDoc(collection(db, "clientes"), cliente);
                        clienteId = novoClienteRef.id;
                    } else {
                        clienteId = clienteSnapshot.docs[0].id;
                    }
                }

                for (const itemCarrinho of carrinho) {
                    const precoVendaItem = itemCarrinho.joia.preco_venda * itemCarrinho.quantidade;
                    const comissaoItem = precoVendaItem * (itemCarrinho.joia.percentual_comissao / 100);
                    
                    const itemVendaData = {
                        vendaId: vendaRef.id,
                        joiaId: itemCarrinho.joiaId,
                        quantidade: itemCarrinho.quantidade,
                        preco_venda_unitario_momento: itemCarrinho.joia.preco_venda,
                        preco_custo_unitario_momento: itemCarrinho.joia.preco_custo || 0,
                        comissao_calculada: comissaoItem
                    };
                    transaction.set(doc(collection(db, "itemVenda")), itemVendaData);
                    
                    totalVendaBruto += precoVendaItem;
                    totalCusto += (itemCarrinho.joia.preco_custo || 0) * itemCarrinho.quantidade;
                    totalComissao += comissaoItem;
                }
                
                transaction.set(vendaRef, {
                    quiosqueId: quiosque.id,
                    vendedorId: user.uid,
                    clienteId: clienteId,
                    data_venda: serverTimestamp(),
                    metodo_pagamento: metodoPagamento,
                    desconto: 0.00,
                    total_venda: totalVendaBruto,
                    total_custo: totalCusto,
                    total_comissao: totalComissao,
                });

                updates.forEach(update => {
                    transaction.update(update.ref, { quantidade: update.novaQuantidade });
                });
            });

            setSuccess("Venda finalizada com sucesso!");
            setCarrinho([]);
            setCliente({ nome: '', email: '', whatsapp: '' });
            fetchData();

        } catch (err) {
            console.error("Erro na transação:", err);
            setError(err.message || "Erro ao finalizar a venda.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !quiosque) {
        return <p>Carregando Ponto de Venda...</p>
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>VOOUD PDV ({quiosque?.identificador})</h1>
                <div>
                    {user && <span>Olá, {user.nome || user.email}</span>}
                    {user && user.role === 'admin' && <Link to="/catalogo" className="admin-dashboard-link">Admin</Link>}
                    <button onClick={logoutUser} className="logout-button">Sair</button>
                </div>
            </header>
            <main className="pdv-grid">
                <div className="pdv-inventario">
                    <h3>Inventário do Quiosque</h3>
                    <div className="inventario-grid-visual">
                        {inventario.map(item => (
                            <div key={item.id} className="joia-card" onClick={() => adicionarAoCarrinho(item)}>
                                <img src={item.joia.imagem_principal_url || 'https://via.placeholder.com/150'} alt={item.joia.nome} className="joia-card-img" />
                                <div className="joia-card-info">
                                    <p className="joia-card-nome">{item.joia.nome}</p>
                                    <p className="joia-card-preco">R$ {item.joia.preco_venda.toFixed(2)}</p>
                                    <p className="joia-card-estoque">Estoque: {item.quantidade}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pdv-venda card">
                    <h3>Nova Venda</h3>
                    {success && <p className="success-message">{success}</p>}
                    {error && <p className="error-message">{error}</p>}
                    <form onSubmit={finalizarVenda}>
                         <div className="carrinho-secao">
                            <h4>Carrinho</h4>
                            {carrinho.length === 0 ? <p>Adicione itens do inventário clicando neles à esquerda.</p> :
                                carrinho.map(item => (
                                    <div key={item.joia.id} className="carrinho-item">
                                        <span>{item.quantidade}x {item.joia.nome}</span>
                                        <span>R$ {(item.joia.preco_venda * item.quantidade).toFixed(2)}</span>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="carrinho-total">
                            <strong>Total:</strong>
                            <strong>R$ {calcularTotalCarrinho()}</strong>
                        </div>
                        <div className="cliente-secao">
                            <h4>Dados do Cliente</h4>
                            <input type="text" placeholder="Nome do Cliente" value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} required />
                            <input type="email" placeholder="Email do Cliente (para garantia)" value={cliente.email} onChange={e => setCliente({...cliente, email: e.target.value})} required />
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
                        <button type="submit" className="finalizar-venda-button" disabled={loading || carrinho.length === 0}>
                            {loading ? 'Processando...' : 'Finalizar Venda'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;