import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import { getInventarioForQuiosque } from '../../services/operationsService';
import { getJoias } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import './DashboardPage.css';

const DashboardPage = () => {
    // ================== CORREÇÃO AQUI ==================
    // Alterado de 'loading: authLoading' para apenas 'loading' para resolver o erro de sintaxe.
    const { user, loading } = useAuth();
    // ===================================================
    const navigate = useNavigate();

    // === Estados do Componente ===
    const [view, setView] = useState('pdv'); // 'pdv' ou 'fechamento'
    const [inventarioDisponivel, setInventarioDisponivel] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [internalLoading, setInternalLoading] = useState(true); // Renomeado para não conflitar com 'loading' do AuthContext
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const quiosqueId = user?.quiosqueId || null; 
    const vendedorId = user?.uid || null;

    // === Lógica de Carregamento de Dados ===
    const carregarInventario = useCallback(async () => {
        if (!quiosqueId) {
            setInternalLoading(false);
            return;
        }
        setInternalLoading(true);
        setError('');
        try {
            const joias = await getJoias();
            const inventario = await getInventarioForQuiosque(quiosqueId, joias);
            setInventarioDisponivel(inventario);
        } catch (err) {
            console.error("Erro detalhado ao carregar inventário:", err);
            setError("Falha ao carregar os produtos. Verifique sua conexão ou permissões.");
        } finally {
            setInternalLoading(false);
        }
    }, [quiosqueId]);

    useEffect(() => {
        // ================== CORREÇÃO AQUI ==================
        // Usando a variável 'loading' vinda do useAuth().
        if (!loading) {
        // ===================================================
            if (user?.role === 'administrador') {
                navigate('/catalogo', { replace: true });
            } 
            else if (user?.role === 'vendedor' && user?.associado) {
                carregarInventario();
            } else {
                setInternalLoading(false);
            }
        }
    }, [user, loading, navigate, carregarInventario]);

    // === Funções de Manipulação de Estado e Eventos ===
    const clearMessages = () => { setError(''); setSuccess(''); };

    const handleAddItemAoCarrinho = (itemInventario) => {
        clearMessages();
        if (!itemInventario.joia || !itemInventario.joia.id) {
            setError("Este item do inventário está com dados de produto inválidos.");
            return;
        }
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.inventarioId === itemInventario.id);
            if (itemExistente) {
                const novaQuantidade = itemExistente.quantidade + 1;
                if (novaQuantidade > itemInventario.quantidade) {
                    setError(`Estoque insuficiente para "${itemExistente.nome}". Disponível: ${itemInventario.quantidade}`);
                    return prevCarrinho;
                }
                return prevCarrinho.map(item =>
                    item.inventarioId === itemInventario.id ? { ...item, quantidade: novaQuantidade } : item
                );
            } else {
                if (1 > itemInventario.quantidade) {
                    setError(`Estoque insuficiente para "${itemInventario.joia.nome}". Disponível: ${itemInventario.quantidade}`);
                    return prevCarrinho;
                }
                const novoItem = { ...itemInventario.joia, inventarioId: itemInventario.id, quantidade: 1 };
                return [...prevCarrinho, novoItem];
            }
        });
    };

    const handleRemoverItemDoCarrinho = (inventarioId) => {
        clearMessages();
        setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.inventarioId !== inventarioId));
    };

    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + ((item.preco_venda || 0) * item.quantidade), 0);
    };

    const handleFinalizarVenda = async () => {
        clearMessages();
        setInternalLoading(true);
        const itemSemInventarioId = carrinho.find(item => !item.inventarioId);
        if (itemSemInventarioId) {
            setError(`O item "${itemSemInventarioId.nome}" está sem referência de inventário.`);
            setInternalLoading(false);
            return;
        }
        try {
            await runTransaction(db, async (transaction) => {
                const inventarioRefs = carrinho.map(item => doc(db, "inventario", item.inventarioId));
                const inventarioDocs = await Promise.all(inventarioRefs.map(ref => transaction.get(ref)));
                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];
                    if (!inventarioDoc.exists()) throw new Error(`O item "${itemCarrinho.nome}" saiu de estoque.`);
                    const estoqueAtual = inventarioDoc.data().quantidade;
                    if (estoqueAtual < itemCarrinho.quantidade) throw new Error(`Estoque insuficiente para "${itemCarrinho.nome}". Disponível: ${estoqueAtual}`);
                }
                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];
                    const novoEstoque = inventarioDoc.data().quantidade - itemCarrinho.quantidade;
                    transaction.update(inventarioRefs[i], { quantidade: novoEstoque });
                }
                const vendaRef = doc(collection(db, "vendas"));
                transaction.set(vendaRef, {
                    vendedorId, quiosqueId,
                    itens: carrinho.map(item => ({ 
                        joiaId: item.id, nome: item.nome, sku: item.sku, quantidade: item.quantidade,
                        preco_venda: item.preco_venda, percentual_comissao: item.percentual_comissao,
                        valor_comissao: (item.preco_venda * (item.percentual_comissao / 100)) * item.quantidade
                    })),
                    total: calcularTotal(), data: serverTimestamp()
                });
            });
            setSuccess("Venda realizada com sucesso!");
            setCarrinho([]);
            setView('pdv');
        } catch (err) {
            console.error("Erro na transação:", err);
            setError(err.message || "Ocorreu um erro ao finalizar a venda.");
        } finally {
            setInternalLoading(false);
        }
    };

    // === Renderização Condicional ===
    if (loading) {
        // Mostra um loader geral enquanto o AuthContext está carregando
        return <AdminLayout title="Carregando..."><p>Verificando usuário...</p></AdminLayout>;
    }

    if (user?.role === 'vendedor' && !user?.associado) {
        return (
            <AdminLayout title="Conta Pendente">
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Aguardando Aprovação</h2>
                    <p>Sua conta de vendedor foi criada com sucesso, mas ainda precisa ser associada a um quiosque por um administrador.</p>
                </div>
            </AdminLayout>
        );
    }
    
    if (user?.role === 'vendedor' && user?.associado) {
        return (
            <AdminLayout title="Ponto de Venda">
                <div className="dashboard-pdv-container">
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    {view === 'pdv' && (
                        <div className="pdv-grid">
                            <div className="produtos-disponiveis">
                                <h3>Produtos em Estoque</h3>
                                <div className="lista-produtos">
                                    {internalLoading ? <p>Carregando...</p> : inventarioDisponivel.map(item => (
                                        <div key={item.id} className="produto-card" onClick={() => handleAddItemAoCarrinho(item)}>
                                            <h4>{item.joia?.nome || 'Produto sem nome'}</h4>
                                            <p>Estoque: {item.quantidade}</p>
                                            <p>R$ {item.joia?.preco_venda ? item.joia.preco_venda.toFixed(2) : '0.00'}</p>
                                            <p>SKU: {item.joia?.sku || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="carrinho-pdv">
                                <h3>Carrinho</h3>
                                <div className="lista-carrinho">{/* ...carrinho JSX... */}</div>
                                <div className="carrinho-total"><strong>Total: R$ {calcularTotal().toFixed(2)}</strong></div>
                                <button className="finalizar-venda-btn" onClick={() => carrinho.length > 0 ? setView('fechamento') : setError("O carrinho está vazio.")}>Finalizar Venda</button>
                            </div>
                        </div>
                    )}
                    {view === 'fechamento' && (
                        <div className="fechamento-venda-container">{/* ...fechamento JSX... */}</div>
                    )}
                </div>
            </AdminLayout>
        );
    }

    return null;
};

export default DashboardPage;