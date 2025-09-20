import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import Modal from '../../components/Modal/Modal';
import { getJoias } from '../../services/catalogService';
import { 
    getLojas, addLoja, updateLoja, deleteLoja,
    getQuiosques, addQuiosque, updateQuiosque, deleteQuiosque,
    getVendedores,
    approveVendedor, // <- ADICIONADO: Import da nova função
    getInventarioForQuiosque, addOrUpdateInventarioItem 
} from '../../services/operationsService';
import './OperationsPage.css';

const OperationsPage = () => {
    // --- Estados para guardar os dados do banco de dados ---
    const [lojas, setLojas] = useState([]);
    const [quiosques, setQuiosques] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [joias, setJoias] = useState([]);
    const [inventario, setInventario] = useState([]);

    // --- Estados de UI, formulários ---
    const [loading, setLoading] = useState(true);
    const [nomeLoja, setNomeLoja] = useState('');
    const [isLojaModalOpen, setIsLojaModalOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState(null);
    const [novoNomeLoja, setNovoNomeLoja] = useState('');
    const [novoQuiosque, setNovoQuiosque] = useState({ identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50 });
    const [isQuiosqueModalOpen, setIsQuiosqueModalOpen] = useState(false);
    const [editingQuiosque, setEditingQuiosque] = useState(null);
    const [selectedQuiosqueId, setSelectedQuiosqueId] = useState('');
    const [itemInventario, setItemInventario] = useState({ joiaId: '', quantidade: 1 });
    
    // ADICIONADO: Estado para controlar o quiosque selecionado na aprovação
    const [quiosqueParaAprovar, setQuiosqueParaAprovar] = useState({});

    // --- Carregamento de Dados ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [lojasData, quiosquesData, vendedoresData, joiasData] = await Promise.all([
                getLojas(),
                getQuiosques(),
                getVendedores(),
                getJoias([])
            ]);
            setLojas(lojasData);
            setQuiosques(quiosquesData);
            setVendedores(vendedoresData);
            setJoias(joiasData);
        } catch (err) {
            toast.error("Erro ao carregar dados iniciais.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ADICIONADO: Memoização para filtrar vendedores pendentes de forma otimizada
    const vendedoresPendentes = useMemo(() => vendedores.filter(v => !v.associado), [vendedores]);

    // ADICIONADO: Nova função para aprovar um vendedor
    const handleApproveVendedor = async (vendedorId) => {
        const quiosqueId = quiosqueParaAprovar[vendedorId];
        if (!quiosqueId) {
            toast.error("Por favor, selecione um quiosque para associar ao vendedor.");
            return;
        }
        setLoading(true);
        try {
            await approveVendedor(vendedorId, quiosqueId);
            toast.success("Vendedor aprovado e associado com sucesso!");
            fetchData(); // Recarrega os dados para atualizar a lista
        } catch (err) {
            toast.error("Erro ao aprovar vendedor.");
        } finally {
            setLoading(false);
        }
    };

    // --- Funções CRUD para Lojas ---
    const handleAddLoja = async (e) => {
        e.preventDefault();
        if (!nomeLoja) return;
        setLoading(true);
        try {
            await addLoja(nomeLoja);
            toast.success('Loja adicionada com sucesso!');
            setNomeLoja('');
            fetchData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLoja = async (e) => {
        e.preventDefault();
        if (!novoNomeLoja || !editingLoja) return;
        setLoading(true);
        try {
            await updateLoja(editingLoja.id, novoNomeLoja);
            toast.success('Loja atualizada com sucesso!');
            handleCloseLojaModal();
            fetchData();
        } catch (err) {
            toast.error('Erro ao atualizar loja.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLoja = async (lojaId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta loja?")) return;
        setLoading(true);
        try {
            await deleteLoja(lojaId);
            toast.success('Loja excluída com sucesso!');
            fetchData();
        } catch (err) {
            toast.error('Erro ao excluir loja. Verifique se não há quiosques associados.');
        } finally {
            setLoading(false);
        }
    };

    // --- Funções CRUD para Quiosques ---
    const handleAddQuiosque = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addQuiosque(novoQuiosque);
            toast.success('Quiosque adicionado com sucesso!');
            setNovoQuiosque({ identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50 });
            fetchData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuiosque = async (e) => {
        e.preventDefault();
        if (!editingQuiosque) return;
        setLoading(true);
        try {
            await updateQuiosque(editingQuiosque.id, editingQuiosque);
            toast.success('Quiosque atualizado com sucesso!');
            handleCloseQuiosqueModal();
            fetchData();
        } catch (err) {
            toast.error('Erro ao atualizar quiosque.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiosque = async (quiosqueId) => {
        if (!window.confirm("Tem certeza que deseja excluir este quiosque?")) return;
        setLoading(true);
        try {
            await deleteQuiosque(quiosqueId);
            toast.success('Quiosque excluído com sucesso!');
            fetchData();
        } catch (err) {
            toast.error('Erro ao excluir quiosque.');
        } finally {
            setLoading(false);
        }
    };

    // --- Funções de Inventário ---
    const handleSelectQuiosqueInventario = async (quiosqueId) => {
        setSelectedQuiosqueId(quiosqueId);
        if (quiosqueId) {
            setLoading(true);
            try {
                const inventarioData = await getInventarioForQuiosque(quiosqueId, joias);
                setInventario(inventarioData);
            } catch (err) {
                toast.error("Erro ao carregar inventário.");
            } finally {
                setLoading(false);
            }
        } else {
            setInventario([]);
        }
    };

    const handleAddInventario = async (e) => {
        e.preventDefault();
        if (!itemInventario.joiaId || !selectedQuiosqueId) return;
        setLoading(true);
        try {
            await addOrUpdateInventarioItem(selectedQuiosqueId, itemInventario.joiaId, itemInventario.quantidade);
            toast.success('Inventário atualizado com sucesso!');
            await handleSelectQuiosqueInventario(selectedQuiosqueId); 
            setItemInventario({ joiaId: '', quantidade: 1 });
        } catch (err) {
            toast.error("Erro ao adicionar ao inventário.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditLojaModal = (loja) => { setEditingLoja(loja); setNovoNomeLoja(loja.nome); setIsLojaModalOpen(true); };
    const handleCloseLojaModal = () => { setIsLojaModalOpen(false); setEditingLoja(null); setNovoNomeLoja(''); };
    const handleOpenEditQuiosqueModal = (quiosque) => { setEditingQuiosque({ ...quiosque }); setIsQuiosqueModalOpen(true); };
    const handleCloseQuiosqueModal = () => { setIsQuiosqueModalOpen(false); setEditingQuiosque(null); };
    
    return (
        <AdminLayout title="Gerenciamento de Operações">
            <Modal show={isLojaModalOpen} onClose={handleCloseLojaModal} title="Editar Nome da Loja">
                <form onSubmit={handleUpdateLoja}>
                    <input type="text" value={novoNomeLoja} onChange={(e) => setNovoNomeLoja(e.target.value)} required className="input-field" />
                    <div className="form-actions">
                        <button type="button" onClick={handleCloseLojaModal} className="cancel-button">Cancelar</button>
                        <button type="submit" className="save-button" disabled={loading}>Salvar</button>
                    </div>
                </form>
            </Modal>

            <Modal show={isQuiosqueModalOpen} onClose={handleCloseQuiosqueModal} title="Editar Quiosque">
                {editingQuiosque && (
                    <form onSubmit={handleUpdateQuiosque}>
                        <input type="text" placeholder="Identificador" value={editingQuiosque.identificador} onChange={e => setEditingQuiosque({...editingQuiosque, identificador: e.target.value})} required className="input-field"/>
                        <select value={editingQuiosque.lojaId} onChange={e => setEditingQuiosque({...editingQuiosque, lojaId: e.target.value})} required className="select-field">
                            <option value="">Selecione a Loja</option>
                            {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
                        </select>
                        <select value={editingQuiosque.vendedorResponsavelId} onChange={e => setEditingQuiosque({...editingQuiosque, vendedorResponsavelId: e.target.value})} className="select-field">
                            <option value="">Nenhum Vendedor Associado</option>
                            {vendedores.filter(v => v.associado).map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                        </select>
                        <input type="number" placeholder="Capacidade de Joias" value={editingQuiosque.capacidade_joias} onChange={e => setEditingQuiosque({...editingQuiosque, capacidade_joias: e.target.value})} required className="input-field"/>
                        <div className="form-actions">
                            <button type="button" onClick={handleCloseQuiosqueModal} className="cancel-button">Cancelar</button>
                            <button type="submit" className="save-button" disabled={loading}>Salvar</button>
                        </div>
                    </form>
                )}
            </Modal>
            
            {/* ADICIONADO: Nova Seção de Aprovação de Vendedores */}
            <div className="card">
                <h3>Aprovações de Vendedores Pendentes</h3>
                <div className="item-list">
                    {loading ? <p>Carregando...</p> : (
                        vendedoresPendentes.length > 0 ? (
                            vendedoresPendentes.map(vendedor => (
                                <div key={vendedor.id} className="list-item approval-item">
                                    <div className="vendedor-info">
                                        <strong>{vendedor.nome}</strong>
                                        <small>{vendedor.email}</small>
                                    </div>
                                    <div className="approval-actions">
                                        <select 
                                            value={quiosqueParaAprovar[vendedor.id] || ''} 
                                            onChange={(e) => setQuiosqueParaAprovar({...quiosqueParaAprovar, [vendedor.id]: e.target.value})}
                                            className="select-field"
                                        >
                                            <option value="">Associar ao Quiosque...</option>
                                            {quiosques.map(q => <option key={q.id} value={q.id}>{q.identificador}</option>)}
                                        </select>
                                        <button 
                                            onClick={() => handleApproveVendedor(vendedor.id)} 
                                            className="action-button approve-button" 
                                            disabled={loading}
                                        >
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Nenhum vendedor pendente de aprovação.</p>
                        )
                    )}
                </div>
            </div>

            <div className="operations-grid">
                <div className="card">
                    <h3>Gerenciar Lojas</h3>
                    <form onSubmit={handleAddLoja} className="inline-form">
                        <input type="text" placeholder="Nome da Nova Loja" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} required />
                        <button type="submit" disabled={loading}>Adicionar</button>
                    </form>
                    <div className="item-list">
                        {lojas.map(loja => (
                            <div key={loja.id} className="list-item">
                                <span>{loja.nome}</span>
                                <div className="item-actions">
                                    <button onClick={() => handleOpenEditLojaModal(loja)} className="action-button edit-button" disabled={loading}>Editar</button>
                                    <button onClick={() => handleDeleteLoja(loja.id)} className="action-button delete-button" disabled={loading}>Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3>Gerenciar Quiosques</h3>
                    <form onSubmit={handleAddQuiosque} className="stacked-form">
                        <input type="text" placeholder="Identificador (ex: QUIOSQUE-SP-01)" value={novoQuiosque.identificador} onChange={e => setNovoQuiosque({...novoQuiosque, identificador: e.target.value})} required />
                        <select value={novoQuiosque.lojaId} onChange={e => setNovoQuiosque({...novoQuiosque, lojaId: e.target.value})} required>
                            <option value="">Selecione a Loja</option>
                            {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
                        </select>
                        <select value={novoQuiosque.vendedorResponsavelId} onChange={e => setNovoQuiosque({...novoQuiosque, vendedorResponsavelId: e.target.value})}>
                            <option value="">Associar um Vendedor (Opcional)</option>
                            {vendedores.filter(v => v.associado).map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                        </select>
                        <input type="number" placeholder="Capacidade de Joias" value={novoQuiosque.capacidade_joias} onChange={e => setNovoQuiosque({...novoQuiosque, capacidade_joias: e.target.value})} required />
                        <button type="submit" disabled={loading}>Adicionar Quiosque</button>
                    </form>
                    <div className="item-list">
                        {quiosques.map(quiosque => (
                            <div key={quiosque.id} className="list-item">
                                <span>{quiosque.identificador} <small>({lojas.find(l => l.id === quiosque.lojaId)?.nome || 'Loja não encontrada'})</small></span>
                                <div className="item-actions">
                                    <button onClick={() => handleOpenEditQuiosqueModal(quiosque)} className="action-button edit-button" disabled={loading}>Editar</button>
                                    <button onClick={() => handleDeleteQuiosque(quiosque.id)} className="action-button delete-button" disabled={loading}>Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Gerenciar Inventário de Quiosque</h3>
                <div className="form-group">
                    <label>Selecione um Quiosque para Gerenciar</label>
                    <select onChange={(e) => handleSelectQuiosqueInventario(e.target.value)} value={selectedQuiosqueId}>
                        <option value="">-- Selecione um Quiosque --</option>
                        {quiosques.map(q => <option key={q.id} value={q.id}>{q.identificador}</option>)}
                    </select>
                </div>

                {selectedQuiosqueId && (
                    <div className="inventario-gerenciamento">
                        <form onSubmit={handleAddInventario} className="inventario-form">
                            <select value={itemInventario.joiaId} onChange={e => setItemInventario({...itemInventario, joiaId: e.target.value})} required>
                                <option value="">Selecione uma Joia para Adicionar</option>
                                {joias.map(j => <option key={j.id} value={j.id}>{j.nome} ({j.sku})</option>)}
                            </select>
                            <input type="number" min="1" placeholder="Qtd." value={itemInventario.quantidade} onChange={e => setItemInventario({...itemInventario, quantidade: e.target.value})} required />
                            <button type="submit" disabled={loading}>{loading ? '...' : 'Adicionar ao Estoque'}</button>
                        </form>
                        <div className="inventario-tabela">
                            <h4>Estoque Atual do Quiosque</h4>
                            <table>
                                <thead>
                                    <tr><th>Joia</th><th>SKU</th><th>Quantidade em Estoque</th></tr>
                                </thead>
                                <tbody>
                                    {inventario.length > 0 ? inventario.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.joia?.nome || 'Joia não encontrada'}</td>
                                            <td>{item.joia?.sku || '-'}</td>
                                            <td>{item.quantidade}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3">Nenhum item no inventário.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default OperationsPage;