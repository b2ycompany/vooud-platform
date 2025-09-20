import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // 1. IMPORTANDO O 'TOAST'
import { db } from '../../firebase';
import { collection, doc, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import { getInventarioForQuiosque } from '../../services/operationsService';
import { getJoias } from '../../services/catalogService';
import { searchClientes, addCliente } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import Modal from '../../components/Modal/Modal';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // === Estados do Componente ===
    const [view, setView] = useState('pdv');
    const [inventarioDisponivel, setInventarioDisponivel] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [internalLoading, setInternalLoading] = useState(true);
    // 2. REMOVIDO: const [error, setError] = useState('');
    // 2. REMOVIDO: const [success, setSuccess] = useState('');

    // === Novos Estados para Fechamento de Venda ===
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedPagamento, setSelectedPagamento] = useState('');
    const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', cpf: '', telefone: '' });

    const quiosqueId = user?.quiosqueId || null; 
    const vendedorId = user?.uid || null;

    // === Lógica de Carregamento de Dados ===
    const carregarInventario = useCallback(async () => {
        if (!quiosqueId) {
            setInternalLoading(false);
            return;
        }
        setInternalLoading(true);
        try {
            const joias = await getJoias();
            const inventario = await getInventarioForQuiosque(quiosqueId, joias);
            setInventarioDisponivel(inventario);
        } catch (err) {
            console.error("Erro detalhado ao carregar inventário:", err);
            toast.error("Falha ao carregar os produtos. Verifique sua conexão ou permissões."); // ALTERADO
        } finally {
            setInternalLoading(false);
        }
    }, [quiosqueId]);

    useEffect(() => {
        if (!loading) {
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

    // 2. REMOVIDO: const clearMessages = () => { setError(''); setSuccess(''); };

    const handleAddItemAoCarrinho = (itemInventario) => {
        if (!itemInventario.joia || !itemInventario.joia.id) {
            toast.error("Este item do inventário está com dados de produto inválidos."); // ALTERADO
            return;
        }
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.inventarioId === itemInventario.id);
            if (itemExistente) {
                const novaQuantidade = itemExistente.quantidade + 1;
                if (novaQuantidade > itemInventario.quantidade) {
                    toast.error(`Estoque insuficiente para "${itemExistente.nome}". Disponível: ${itemInventario.quantidade}`); // ALTERADO
                    return prevCarrinho;
                }
                return prevCarrinho.map(item =>
                    item.inventarioId === itemInventario.id ? { ...item, quantidade: novaQuantidade } : item
                );
            } else {
                if (1 > itemInventario.quantidade) {
                    toast.error(`Estoque insuficiente para "${itemInventario.joia.nome}". Disponível: ${itemInventario.quantidade}`); // ALTERADO
                    return prevCarrinho;
                }
                const novoItem = { ...itemInventario.joia, inventarioId: itemInventario.id, quantidade: 1 };
                return [...prevCarrinho, novoItem];
            }
        });
    };

    const handleRemoverItemDoCarrinho = (inventarioId) => {
        setCarrinho(prevCarrinho => prevCarrinho.filter(item => item.inventarioId !== inventarioId));
    };

    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + ((item.preco_venda || 0) * item.quantidade), 0);
    };

    const handleSearchChange = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            try {
                const results = await searchClientes(term);
                setSearchResults(results);
            } catch {
                toast.error("Erro ao buscar clientes."); // ALTERADO
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectCliente = (cliente) => {
        setSelectedCliente(cliente);
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleSaveCliente = async (e) => {
        e.preventDefault();
        setInternalLoading(true);
        try {
            const clienteCriado = await addCliente(novoCliente);
            toast.success("Cliente cadastrado com sucesso!"); // ALTERADO
            setSelectedCliente(clienteCriado);
            setIsClienteModalOpen(false);
            setNovoCliente({ nome: '', email: '', cpf: '', telefone: '' });
        } catch (err) {
            toast.error("Erro ao cadastrar cliente."); // ALTERADO
        } finally {
            setInternalLoading(false);
        }
    };

    const handleFinalizarVenda = async () => {
        if (!selectedCliente) {
            toast.error("Por favor, selecione um cliente para a venda."); // ALTERADO
            return;
        }
        if (!selectedPagamento) {
            toast.error("Por favor, selecione uma forma de pagamento."); // ALTERADO
            return;
        }

        setInternalLoading(true);
        const itemSemInventarioId = carrinho.find(item => !item.inventarioId);
        if (itemSemInventarioId) {
            toast.error(`O item "${itemSemInventarioId.nome}" está sem referência de inventário.`); // ALTERADO
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
                    vendedorId,
                    quiosqueId,
                    clienteId: selectedCliente.id,
                    clienteNome: selectedCliente.nome,
                    formaPagamento: selectedPagamento,
                    itens: carrinho.map(item => ({ 
                        joiaId: item.id, nome: item.nome, sku: item.sku, quantidade: item.quantidade,
                        preco_venda: item.preco_venda, percentual_comissao: item.percentual_comissao,
                        valor_comissao: (item.preco_venda * (item.percentual_comissao / 100)) * item.quantidade
                    })),
                    total: calcularTotal(),
                    data: serverTimestamp()
                });
            });
            toast.success("Venda realizada com sucesso!"); // ALTERADO
            setCarrinho([]);
            setSelectedCliente(null);
            setSelectedPagamento('');
            setView('pdv');
        } catch (err) {
            console.error("Erro na transação:", err);
            toast.error(err.message || "Ocorreu um erro ao finalizar a venda."); // ALTERADO
        } finally {
            setInternalLoading(false);
        }
    };

    // === Renderização Condicional ===
    if (loading) {
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
                <Modal show={isClienteModalOpen} onClose={() => setIsClienteModalOpen(false)} title="Cadastrar Novo Cliente">
                    <form onSubmit={handleSaveCliente}>
                        <input className="input-field" type="text" placeholder="Nome Completo" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} required />
                        <input className="input-field" type="email" placeholder="E-mail" value={novoCliente.email} onChange={e => setNovoCliente({...novoCliente, email: e.target.value})} />
                        <input className="input-field" type="text" placeholder="CPF" value={novoCliente.cpf} onChange={e => setNovoCliente({...novoCliente, cpf: e.target.value})} />
                        <input className="input-field" type="text" placeholder="Telefone / WhatsApp" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} />
                        <div className="form-actions">
                            <button type="button" onClick={() => setIsClienteModalOpen(false)} className="cancel-button">Cancelar</button>
                            <button type="submit" className="save-button" disabled={internalLoading}>Salvar Cliente</button>
                        </div>
                    </form>
                </Modal>

                <div className="dashboard-pdv-container">
                    {/* 2. REMOVIDO: As tags <p> de erro e sucesso que ficavam aqui */}
                    
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
                                <div className="lista-carrinho">
                                    {carrinho.length === 0 ? <p>Nenhum item adicionado.</p> : carrinho.map(item => (
                                        <div key={item.inventarioId} className="carrinho-item">
                                            <span>{item.nome} (x{item.quantidade})</span>
                                            <span>R$ {((item.preco_venda || 0) * item.quantidade).toFixed(2)}</span>
                                            <button onClick={() => handleRemoverItemDoCarrinho(item.inventarioId)} className="remove-btn">Remover</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="carrinho-total"><strong>Total: R$ {calcularTotal().toFixed(2)}</strong></div>
                                <button className="finalizar-venda-btn" onClick={() => carrinho.length > 0 ? setView('fechamento') : toast.error("O carrinho está vazio.")}>Finalizar Venda</button>
                            </div>
                        </div>
                    )}
                    
                    {view === 'fechamento' && (
                        <div className="fechamento-venda-container">
                            <div className="fechamento-header">
                                <button onClick={() => setView('pdv')} className="voltar-btn">&larr; Voltar ao PDV</button>
                                <h2>Fechamento de Venda</h2>
                            </div>
                            <div className="card resumo-carrinho">
                                <h4>Resumo do Pedido</h4>
                                {carrinho.map(item => (
                                    <div key={item.inventarioId} className="resumo-item">
                                        <span>{item.nome} (x{item.quantidade})</span>
                                        <span>R$ {((item.preco_venda || 0) * item.quantidade).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="resumo-total"><strong>Total: R$ {calcularTotal().toFixed(2)}</strong></div>
                            </div>
                            <div className="card secao-cliente">
                                <h4>Cliente</h4>
                                {!selectedCliente ? (
                                    <div className="search-container">
                                        <input type="text" placeholder="Buscar cliente por nome..." className="input-field" value={searchTerm} onChange={handleSearchChange} />
                                        {searchResults.length > 0 && (
                                            <div className="search-results">
                                                {searchResults.map(cliente => (
                                                    <div key={cliente.id} className="result-item" onClick={() => handleSelectCliente(cliente)}>
                                                        {cliente.nome}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="selected-cliente-card">
                                        <span>{selectedCliente.nome}</span>
                                        <button onClick={() => setSelectedCliente(null)} className="remove-btn">Trocar</button>
                                    </div>
                                )}
                                <button onClick={() => setIsClienteModalOpen(true)} className="link-button">Cadastrar Novo Cliente</button>
                            </div>
                            <div className="card secao-pagamento">
                                <h4>Forma de Pagamento</h4>
                                <div className="botoes-pagamento">
                                    <button onClick={() => setSelectedPagamento('PIX')} className={`pagamento-btn ${selectedPagamento === 'PIX' ? 'active' : ''}`}>PIX</button>
                                    <button onClick={() => setSelectedPagamento('Crédito')} className={`pagamento-btn ${selectedPagamento === 'Crédito' ? 'active' : ''}`}>Crédito</button>
                                    <button onClick={() => setSelectedPagamento('Débito')} className={`pagamento-btn ${selectedPagamento === 'Débito' ? 'active' : ''}`}>Débito</button>
                                </div>
                            </div>
                            <button className="confirmar-venda-btn" onClick={handleFinalizarVenda} disabled={internalLoading}>
                                {internalLoading ? 'Processando...' : `Confirmar Venda`}
                            </button>
                        </div>
                    )}
                </div>
            </AdminLayout>
        );
    }

    return null;
};

export default DashboardPage;