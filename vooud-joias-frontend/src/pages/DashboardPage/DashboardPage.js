import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, runTransaction, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getInventarioForQuiosque } from '../../services/operationsService'; // Importa a função correta
import { getJoias } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user } = useAuth();
    
    // TODO: A lógica para obter o quiosque deve ser implementada em produção
    const quiosqueId = "ID_DO_QUIOSQUE_ATUAL"; 
    const vendedorId = user ? user.uid : null; 

    const [inventarioDisponivel, setInventarioDisponivel] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const carregarInventario = async () => {
            if (!vendedorId || !quiosqueId) {
                setError("Vendedor ou quiosque não identificado. Não é possível carregar o inventário.");
                return;
            }
            try {
                // Busque as joias primeiro, que são os detalhes dos produtos
                const joias = await getJoias();
                // Em seguida, busque o inventário do quiosque específico
                const inventario = await getInventarioForQuiosque(quiosqueId, joias);
                setInventarioDisponivel(inventario);
            } catch (err) {
                console.error("Erro detalhado ao carregar inventário:", err);
                setError("Falha ao carregar os produtos. Verifique sua conexão ou permissões.");
            }
        };

        carregarInventario();
    }, [vendedorId, quiosqueId]);

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
                        preco_venda: item.preco_venda
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
    
    return (
        <AdminLayout title="Ponto de Venda">
            <div className="dashboard-pdv">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <div className="pdv-grid">
                    <div className="produtos-disponiveis">
                        <h3>Produtos em Estoque</h3>
                        <div className="lista-produtos">
                            {inventarioDisponivel.map(item => (
                                <div key={item.id} className="produto-card" onClick={() => handleAddItemAoCarrinho(item)}>
                                    <h4>{item.joia?.nome}</h4>
                                    <p>Estoque: {item.quantidade}</p>
                                    <p>R$ {item.joia?.preco_venda ? item.joia.preco_venda.toFixed(2) : '0.00'}</p>
                                    <p>SKU: {item.joia?.sku}</p>
                                </div>
                            ))}
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
};

export default DashboardPage;