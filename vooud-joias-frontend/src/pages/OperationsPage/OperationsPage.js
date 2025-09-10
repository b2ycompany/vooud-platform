import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import Modal from '../../components/Modal/Modal';
import { getJoias } from '../../services/catalogService'; // Importação necessária para o inventário
import { 
    getLojas, addLoja, updateLoja, deleteLoja,
    getQuiosques, addQuiosque, updateQuiosque, deleteQuiosque,
    getVendedores,
    getInventarioForQuiosque, addOrUpdateInventarioItem 
} from '../../services/operationsService';
import './OperationsPage.css';

const OperationsPage = () => {
    // --- Estados para guardar os dados do banco de dados ---
    const [lojas, setLojas] = useState([]);
    const [quiosques, setQuiosques] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [joias, setJoias] = useState([]); // Re-adicionado para o inventário
    const [inventario, setInventario] = useState([]); // Re-adicionado para o inventário

    // --- Estados de UI, formulários e mensagens ---
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Estados para o formulário de Lojas
    const [nomeLoja, setNomeLoja] = useState('');
    const [isLojaModalOpen, setIsLojaModalOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState(null);
    const [novoNomeLoja, setNovoNomeLoja] = useState('');

    // Estados para o formulário de Quiosques
    const [novoQuiosque, setNovoQuiosque] = useState({ identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50 });
    const [isQuiosqueModalOpen, setIsQuiosqueModalOpen] = useState(false);
    const [editingQuiosque, setEditingQuiosque] = useState(null);

    // Estados para o formulário de Inventário (re-adicionado)
    const [selectedQuiosqueId, setSelectedQuiosqueId] = useState('');
    const [itemInventario, setItemInventario] = useState({ joiaId: '', quantidade: 1 });

    // --- Carregamento de Dados ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [lojasData, quiosquesData, vendedoresData, joiasData] = await Promise.all([
                getLojas(),
                getQuiosques(),
                getVendedores(),
                getJoias([]) // Re-adicionado
            ]);
            setLojas(lojasData);
            setQuiosques(quiosquesData);
            setVendedores(vendedoresData);
            setJoias(joiasData); // Re-adicionado
        } catch (err) {
            setError("Erro ao carregar dados iniciais.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const clearMessages = () => { setError(''); setSuccess(''); };

    // --- Funções CRUD para Lojas ---
    const handleAddLoja = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!nomeLoja) return;
        setLoading(true);
        try {
            await addLoja(nomeLoja);
            setSuccess('Loja adicionada com sucesso!');
            setNomeLoja('');
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditLojaModal = (loja) => {
        setEditingLoja(loja);
        setNovoNomeLoja(loja.nome);
        setIsLojaModalOpen(true);
    };

    const handleCloseLojaModal = () => {
        setIsLojaModalOpen(false);
        setEditingLoja(null);
        setNovoNomeLoja('');
    };

    const handleUpdateLoja = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!novoNomeLoja || !editingLoja) return;
        setLoading(true);
        try {
            await updateLoja(editingLoja.id, novoNomeLoja);
            setSuccess('Loja atualizada com sucesso!');
            handleCloseLojaModal();
            fetchData();
        } catch (err) {
            setError('Erro ao atualizar loja.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLoja = async (lojaId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta loja?")) return;
        clearMessages();
        setLoading(true);
        try {
            await deleteLoja(lojaId);
            setSuccess('Loja excluída com sucesso!');
            fetchData();
        } catch (err) {
            setError('Erro ao excluir loja. Verifique se não há quiosques associados.');
        } finally {
            setLoading(false);
        }
    };

    // --- Funções CRUD para Quiosques ---
    const handleAddQuiosque = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);
        try {
            await addQuiosque(novoQuiosque);
            setSuccess('Quiosque adicionado com sucesso!');
            setNovoQuiosque({ identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50 });
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditQuiosqueModal = (quiosque) => {
        // Cria uma cópia do objeto quiosque para edição para evitar mutação direta do estado
        setEditingQuiosque({ ...quiosque }); 
        setIsQuiosqueModalOpen(true);
    };

    const handleCloseQuiosqueModal = () => {
        setIsQuiosqueModalOpen(false);
        setEditingQuiosque(null);
    };

    const handleUpdateQuiosque = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!editingQuiosque) return;
        setLoading(true);
        try {
            await updateQuiosque(editingQuiosque.id, editingQuiosque);
            setSuccess('Quiosque atualizado com sucesso!');
            handleCloseQuiosqueModal();
            fetchData();
        } catch (err) {
            setError('Erro ao atualizar quiosque.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiosque = async (quiosqueId) => {
        if (!window.confirm("Tem certeza que deseja excluir este quiosque?")) return;
        clearMessages();
        setLoading(true);
        try {
            await deleteQuiosque(quiosqueId);
            setSuccess('Quiosque excluído com sucesso!');
            fetchData();
        } catch (err) {
            setError('Erro ao excluir quiosque.');
        } finally {
            setLoading(false);
        }
    };

    // --- Funções de Inventário (Re-adicionadas) ---
    const handleSelectQuiosqueInventario = async (quiosqueId) => {
        setSelectedQuiosqueId(quiosqueId);
        if (quiosqueId) {
            setLoading(true);
            try {
                const inventarioData = await getInventarioForQuiosque(quiosqueId, joias);
                setInventario(inventarioData);
            } catch (err) {
                setError("Erro ao carregar inventário.");
            } finally {
                setLoading(false);
            }
        } else {
            setInventario([]);
        }
    };

    const handleAddInventario = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!itemInventario.joiaId || !selectedQuiosqueId) return;
        setLoading(true);
        try {
            await addOrUpdateInventarioItem(selectedQuiosqueId, itemInventario.joiaId, itemInventario.quantidade);
            setSuccess('Inventário atualizado com sucesso!');
            await handleSelectQuiosqueInventario(selectedQuiosqueId); 
            setItemInventario({ joiaId: '', quantidade: 1 });
        } catch (err) {
            setError("Erro ao adicionar ao inventário.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <AdminLayout title="Gerenciamento de Operações">
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* Modal de Edição de Loja */}
            <Modal show={isLojaModalOpen} onClose={handleCloseLojaModal} title="Editar Nome da Loja">
                <form onSubmit={handleUpdateLoja}>
                    <input type="text" value={novoNomeLoja} onChange={(e) => setNovoNomeLoja(e.target.value)} required />
                    <div className="form-actions"><button type="button" onClick={handleCloseLojaModal} className="cancel-button">Cancelar</button><button type="submit" className="save-button" disabled={loading}>Salvar</button></div>
                </form>
            </Modal>

            {/* Modal de Edição de Quiosque */}
            <Modal show={isQuiosqueModalOpen} onClose={handleCloseQuiosqueModal} title="Editar Quiosque">
                {editingQuiosque && (
                    <form onSubmit={handleUpdateQuiosque}>
                        <input type="text" placeholder="Identificador" value={editingQuiosque.identificador} onChange={e => setEditingQuiosque({...editingQuiosque, identificador: e.target.value})} required />
                        <select value={editingQuiosque.lojaId} onChange={e => setEditingQuiosque({...editingQuiosque, lojaId: e.target.value})} required>
                            <option value="">Selecione a Loja</option>
                            {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
                        </select>
                        <select value={editingQuiosque.vendedorResponsavelId} onChange={e => setEditingQuiosque({...editingQuiosque, vendedorResponsavelId: e.target.value})}>
                            <option value="">Nenhum Vendedor Associado</option>
                            {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                        </select>
                        <input type="number" placeholder="Capacidade de Joias" value={editingQuiosque.capacidade_joias} onChange={e => setEditingQuiosque({...editingQuiosque, capacidade_joias: e.target.value})} required />
                        <div className="form-actions"><button type="button" onClick={handleCloseQuiosqueModal} className="cancel-button">Cancelar</button><button type="submit" className="save-button" disabled={loading}>Salvar</button></div>
                    </form>
                )}
            </Modal>

            <div className="operations-grid">
                {/* Card de Gerenciamento de Lojas */}
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

                {/* Card de Gerenciamento de Quiosques */}
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
                            {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
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

            {/* Seção de Gerenciamento de Inventário (Re-adicionada) */}
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