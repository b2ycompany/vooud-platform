import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, runTransaction, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getInventarioForQuiosque } from '../../services/operationsService';
import { getJoias } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // === CORREÇÃO: DECLARAÇÃO DOS HOOKS NO TOPO ===
    const [inventarioDisponivel, setInventarioDisponivel] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const quiosqueId = user?.quiosqueId || null; 
    const vendedorId = user?.uid || null;

    const carregarInventario = useCallback(async () => {
        setLoading(true);
        try {
            const joias = await getJoias();
            const inventario = await getInventarioForQuiosque(quiosqueId, joias);
            setInventarioDisponivel(inventario);
            setError(''); // Limpa o erro caso a carga seja bem-sucedida
        } catch (err) {
            console.error("Erro detalhado ao carregar inventário:", err);
            setError("Falha ao carregar os produtos. Verifique sua conexão ou permissões.");
        } finally {
            setLoading(false);
        }
    }, [quiosqueId]);

    useEffect(() => {
        // Redirecionamento e lógica principal do componente
        if (!authLoading) {
            if (user?.role === 'administrador') {
                navigate('/catalogo', { replace: true });
                return;
            }
            if (user?.role === 'vendedor' && quiosqueId) {
                carregarInventario();
            }
        }
    }, [user, authLoading, quiosqueId, navigate, carregarInventario]);
    // ===============================================

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleAddItemAoCarrinho = (itemInventario, quantidade = 1) => {
        clearMessages();
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.inventarioId === itemInventario.id);
            if (itemExistente) {
                if (itemExistente.quantidade + quantidade > itemInventario.quantidade) {
                    setError(`Estoque insuficiente para "${itemExistente.joia.nome}". Disponível: ${itemInventario.quantidade}`);
                    return prevCarrinho;
                }
                return prevCarrinho.map(item =>
                    item.inventarioId === itemInventario.id ? { ...item, quantidade: item.quantidade + quantidade } : item
                );
            } else {
                if (quantidade > itemInventario.quantidade) {
                    setError(`Estoque insuficiente para "${itemInventario.joia.nome}". Disponível: ${itemInventario.quantidade}`);
                    return prevCarrinho;
                }
                return [...prevCarrinho, { ...itemInventario.joia, inventarioId: itemInventario.id, quantidade, preco_venda: itemInventario.joia.preco_venda }];
            }
        });
    };

    const handleRemoverItemDoCarrinho = (inventarioId) => {
        clearMessages();
        setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.inventarioId !== inventarioId));
    };

    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + ((item.preco_venda || 0) * item.quantidade), 0).toFixed(2);
    };

    const handleFinalizarVenda = async () => {
        clearMessages();
        if (carrinho.length === 0) {
            setError("O carrinho está vazio.");
            return;
        }
        if (!vendedorId || !quiosqueId) {
            setError("Vendedor ou quiosque não identificado. Não é possível finalizar a venda.");
            return;
        }
        setLoading(true);

        try {
            await runTransaction(db, async (transaction) => {
                const inventarioRefs = carrinho.map(item => doc(db, "inventario", item.inventarioId));
                const inventarioDocs = await Promise.all(
                    inventarioRefs.map(ref => transaction.get(ref))
                );

                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];

                    if (!inventarioDoc.exists()) {
                        throw new Error(`O item "${itemCarrinho.nome}" não foi encontrado no inventário.`);
                    }

                    const estoqueAtual = inventarioDoc.data().quantidade;
                    if (estoqueAtual < itemCarrinho.quantidade) {
                        throw new Error(`Estoque insuficiente para "${itemCarrinho.nome}". Disponível: ${estoqueAtual}`);
                    }
                }

                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];
                    const novoEstoque = inventarioDoc.data().quantidade - itemCarrinho.quantidade;
                    
                    transaction.update(inventarioRefs[i], { quantidade: novoEstoque });
                }

                const vendaRef = doc(collection(db, "vendas"));
                transaction.set(vendaRef, {
                    vendedorId: vendedorId,
                    quiosqueId: quiosqueId,
                    itens: carrinho.map(item => ({ 
                        joiaId: item.id, 
                        nome: item.nome, 
                        sku: item.sku,
                        quantidade: item.quantidade,
                        preco_venda: item.preco_venda,
                        percentual_comissao: item.percentual_comissao,
                        valor_comissao: (item.preco_venda * (item.percentual_comissao / 100)) * item.quantidade
                    })),
                    total: parseFloat(calcularTotal()),
                    data: serverTimestamp()
                });
            });

            setSuccess("Venda realizada com sucesso!");
            setCarrinho([]);
        } catch (err) {
            console.error("Erro na transação:", err);
            setError(err.message || "Ocorreu um erro ao finalizar a venda.");
        } finally {
            setLoading(false);
        }
    };
    
    // Mostra o acesso negado apenas se for um vendedor e não tiver quiosque associado.
    if (user?.role === 'vendedor' && !quiosqueId) {
        return (
            <AdminLayout title="Acesso Negado">
                <div className="access-denied">
                    <h2>Acesso Negado</h2>
                    <p>Sua conta ainda não foi associada a um quiosque. Por favor, aguarde a aprovação do administrador.</p>
                </div>
            </AdminLayout>
        );
    }
    
    // Renderiza a tela do PDV se for um vendedor com quiosque
    if (user?.role === 'vendedor' && quiosqueId) {
        return (
            <AdminLayout title="Ponto de Venda">
                <div className="dashboard-pdv">
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <div className="pdv-grid">
                        <div className="produtos-disponiveis">
                            <h3>Produtos em Estoque</h3>
                            <div className="lista-produtos">
                                {loading ? (
                                    <p>Carregando produtos...</p>
                                ) : (
                                    inventarioDisponivel.map(item => (
                                        <div key={item.id} className="produto-card" onClick={() => handleAddItemAoCarrinho(item)}>
                                            <h4>{item.joia?.nome}</h4>
                                            <p>Estoque: {item.quantidade}</p>
                                            <p>R$ {item.joia?.preco_venda ? item.joia.preco_venda.toFixed(2) : '0.00'}</p>
                                            <p>SKU: {item.joia?.sku}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="carrinho-pdv">
                            <h3>Carrinho</h3>
                            <div className="lista-carrinho">
                                {carrinho.length === 0 ? (
                                    <p>Nenhum item adicionado.</p>
                                ) : (
                                    carrinho.map(item => (
                                        <div key={item.inventarioId} className="carrinho-item">
                                            <span>{item.nome} (x{item.quantidade})</span>
                                            <span>R$ {((item.preco_venda || 0) * item.quantidade).toFixed(2)}</span>
                                            <button onClick={() => handleRemoverItemDoCarrinho(item.inventarioId)} className="remove-btn">Remover</button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="carrinho-total">
                                <strong>Total: R$ {calcularTotal()}</strong>
                            </div>
                            <button 
                                className="finalizar-venda-btn" 
                                onClick={handleFinalizarVenda} 
                                disabled={loading || carrinho.length === 0}
                            >
                                {loading ? 'Processando...' : 'Finalizar Venda'}
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }
    
    return null; // Retorna null enquanto o estado de autenticação está sendo verificado
};

export default DashboardPage;