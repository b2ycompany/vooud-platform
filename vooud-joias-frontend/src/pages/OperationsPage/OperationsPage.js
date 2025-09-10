import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import Modal from '../../components/Modal/Modal'; // Assumindo que você tem um componente Modal
import { getJoias } from '../../services/catalogService';
import { 
    getLojas, 
    addLoja, 
    updateLoja, 
    deleteLoja, // Funções de Loja atualizadas
    getQuiosques, 
    addQuiosque, 
    getVendedores, 
    updateQuiosque, 
    getInventarioForQuiosque, 
    addOrUpdateInventarioItem 
} from '../../services/operationsService';
import './OperationsPage.css';

const OperationsPage = () => {
    // Listas de dados
    const [lojas, setLojas] = useState([]);
    const [quiosques, setQuiosques] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [joias, setJoias] = useState([]);
    const [inventario, setInventario] = useState([]);

    // Estados dos formulários e UI
    const [novoQuiosque, setNovoQuiosque] = useState({
        identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50
    });
    const [selectedQuiosqueId, setSelectedQuiosqueId] = useState('');
    const [itemInventario, setItemInventario] = useState({ joiaId: '', quantidade: 1 });
    
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // --- NOVOS ESTADOS PARA GERENCIAMENTO DE LOJAS ---
    const [nomeLoja, setNomeLoja] = useState('');
    const [isLojaModalOpen, setIsLojaModalOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState(null); // Guarda a loja sendo editada
    const [novoNomeLoja, setNovoNomeLoja] = useState('');

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
            setError("Erro ao carregar dados iniciais.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };
    
    // --- FUNÇÕES DE CRUD PARA LOJAS ---

    const handleAddLoja = async (e) => {
        e.preventDefault();
        clearMessages();
        if (!nomeLoja) return;
        setLoading(true);
        try {
            await addLoja(nomeLoja);
            setSuccess('Loja adicionada com sucesso!');
            setNomeLoja('');
            await fetchData(); // Recarrega a lista de lojas
        } catch (err) {
            setError(err.message); // Exibe o erro de duplicata
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditModal = (loja) => {
        setEditingLoja(loja);
        setNovoNomeLoja(loja.nome);
        setIsLojaModalOpen(true);
        clearMessages();
    };

    const handleCloseModal = () => {
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
            handleCloseModal();
            await fetchData();
        } catch (err) {
            setError('Erro ao atualizar loja.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLoja = async (lojaId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita.")) {
            return;
        }
        clearMessages();
        setLoading(true);
        try {
            await deleteLoja(lojaId);
            setSuccess('Loja excluída com sucesso!');
            await fetchData();
        } catch (err) {
            setError('Erro ao excluir loja. Verifique se não há quiosques associados a ela.');
        } finally {
            setLoading(false);
        }
    };
    
    // --- Funções existentes ---
    
    const handleAddQuiosque = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);
        try {
            const quiosqueData = { ...novoQuiosque, capacidade_joias: Number(novoQuiosque.capacidade_joias) };
            await addQuiosque(quiosqueData);
            setSuccess('Quiosque adicionado com sucesso!');
            setNovoQuiosque({ identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50 });
            await fetchData();
        } catch (err) {
            setError('Erro ao adicionar quiosque.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSelectQuiosque = async (quiosqueId) => {
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
            await handleSelectQuiosque(selectedQuiosqueId); 
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

            {/* --- MODAL DE EDIÇÃO DE LOJA --- */}
            {isLojaModalOpen && (
                <Modal show={isLojaModalOpen} onClose={handleCloseModal} title="Editar Nome da Loja">
                    <form onSubmit={handleUpdateLoja}>
                        <input 
                            type="text" 
                            value={novoNomeLoja} 
                            onChange={(e) => setNovoNomeLoja(e.target.value)} 
                            required 
                        />
                        <div className="form-actions">
                            <button type="button" onClick={handleCloseModal} className="cancel-button" disabled={loading}>Cancelar</button>
                            <button type="submit" className="save-button" disabled={loading}>
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            
            <div className="operations-grid">
                {/* --- SEÇÃO DE LOJAS --- */}
                <div className="card">
                    <h3>Gerenciar Lojas</h3>
                    <form onSubmit={handleAddLoja} className="inline-form">
                        <input type="text" placeholder="Nome da Loja (ex: Shopping Morumbi)" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} required />
                        <button type="submit" disabled={loading}>Adicionar Loja</button>
                    </form>
                    <div className="item-list">
                        {lojas.map(loja => (
                            <div key={loja.id} className="list-item">
                                <span>{loja.nome}</span>
                                <div className="item-actions">
                                    <button onClick={() => handleOpenEditModal(loja)} className="action-button edit-button" disabled={loading}>Editar</button>
                                    <button onClick={() => handleDeleteLoja(loja.id)} className="action-button delete-button" disabled={loading}>Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- SEÇÃO DE QUIOSQUES (EXISTENTE) --- */}
                <div className="card">
                    <h3>Adicionar Novo Quiosque</h3>
                    <form onSubmit={handleAddQuiosque}>
                        <input type="text" placeholder="Identificador (ex: QUIOSQUE-SP-01)" value={novoQuiosque.identificador} onChange={e => setNovoQuiosque({...novoQuiosque, identificador: e.target.value})} required />
                        <select value={novoQuiosque.lojaId} onChange={e => setNovoQuiosque({...novoQuiosque, lojaId: e.target.value})} required>
                            <option value="">Selecione a Loja</option>
                            {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
                        </select>
                        <select value={novoQuiosque.vendedorResponsavelId} onChange={e => setNovoQuiosque({...novoQuiosque, vendedorResponsavelId: e.target.value})}>
                            <option value="">Associe um Vendedor (Opcional)</option>
                            {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                        </select>
                        <input type="number" placeholder="Capacidade de Joias" value={novoQuiosque.capacidade_joias} onChange={e => setNovoQuiosque({...novoQuiosque, capacidade_joias: e.target.value})} required />
                        <button type="submit" disabled={loading}>Adicionar Quiosque</button>
                    </form>
                </div>
            </div>

            <div className="card">
                <h3>Gerenciar Inventário de Quiosque</h3>
                <div className="form-group">
                    <label>Selecione um Quiosque para Gerenciar</label>
                    <select onChange={(e) => handleSelectQuiosque(e.target.value)} value={selectedQuiosqueId}>
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