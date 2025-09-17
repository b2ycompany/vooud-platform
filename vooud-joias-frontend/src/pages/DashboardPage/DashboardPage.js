import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import { getJoias } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user } = useAuth();
    
    const vendedorId = user ? user.uid : null; 
    const quiosqueId = "ID_DO_QUIOSQUE_ATUAL"; // TODO: Implementar lógica para buscar o quiosque associado ao vendedor

    const [joiasDisponiveis, setJoiasDisponiveis] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const carregarJoias = async () => {
            try {
                const joias = await getJoias();
                setJoiasDisponiveis(joias);
            } catch (err) {
                console.error("Erro detalhado ao carregar produtos:", err);
                setError("Falha ao carregar os produtos. Verifique sua conexão ou permissões.");
            }
        };

        if (vendedorId) {
            carregarJoias();
        }
    }, [vendedorId]);

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleAddItemAoCarrinho = (joia, quantidade = 1) => {
        clearMessages();
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.id === joia.id);
            if (itemExistente) {
                return prevCarrinho.map(item =>
                    item.id === joia.id ? { ...item, quantidade: item.quantidade + quantidade } : item
                );
            } else {
                return [...prevCarrinho, { ...joia, quantidade }];
            }
        });
    };

    const handleRemoverItemDoCarrinho = (joiaId) => {
        clearMessages();
        setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.id !== joiaId));
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
                // ==================================================================
                // LÓGICA DA TRANSAÇÃO QUE FOI REMOVIDA, AGORA RESTAURADA
                // ==================================================================
                const inventarioRefs = carrinho.map(item => doc(db, "inventario", item.inventarioId)); // Assumindo que a joia tem um inventarioId

                // FASE 1: LEITURAS
                const inventarioDocs = await Promise.all(
                    inventarioRefs.map(ref => transaction.get(ref))
                );

                // FASE 2: VALIDAÇÃO
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

                // FASE 3: ESCRITAS
                // 3.1: Atualizar o estoque
                for (let i = 0; i < carrinho.length; i++) {
                    const itemCarrinho = carrinho[i];
                    const inventarioDoc = inventarioDocs[i];
                    const novoEstoque = inventarioDoc.data().quantidade - itemCarrinho.quantidade;
                    
                    transaction.update(inventarioRefs[i], { quantidade: novoEstoque });
                }

                // 3.2: Criar o registro da venda
                const vendaRef = doc(collection(db, "vendas"));
                transaction.set(vendaRef, {
                    vendedorId: vendedorId,
                    quiosqueId: quiosqueId,
                    itens: carrinho,
                    total: parseFloat(calcularTotal()),
                    data: serverTimestamp()
                });
                // ==================================================================
                // FIM DA LÓGICA RESTAURADA
                // ==================================================================
            });

            setSuccess("Venda realizada com sucesso!");
            setCarrinho([]); // Limpa o carrinho após a venda
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
                        <h3>Produtos</h3>
                        <div className="lista-produtos">
                            {joiasDisponiveis.map(joia => (
                                <div key={joia.id} className="produto-card" onClick={() => handleAddItemAoCarrinho(joia)}>
                                    <h4>{joia.nome}</h4>
                                    <p>R$ {joia.preco_venda ? joia.preco_venda.toFixed(2) : '0.00'}</p>
                                    <p>SKU: {joia.sku}</p>
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
                                    <div key={item.id} className="carrinho-item">
                                        <span>{item.nome} (x{item.quantidade})</span>
                                        <span>R$ {((item.preco_venda || 0) * item.quantidade).toFixed(2)}</span>
                                        <button onClick={() => handleRemoverItemDoCarrinho(item.id)} className="remove-btn">Remover</button>
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