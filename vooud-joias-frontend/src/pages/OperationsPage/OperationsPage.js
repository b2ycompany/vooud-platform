import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { getJoias } from '../../services/catalogService';
import { 
    getLojas, 
    addLoja, 
    getQuiosques, 
    addQuiosque, 
    getVendedores, 
    getInventarioForQuiosque, 
    addOrUpdateInventarioItem,
    updateQuiosque // Importa a nova função
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
    const [nomeLoja, setNomeLoja] = useState('');
    const [novoQuiosque, setNovoQuiosque] = useState({
        identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50
    });
    const [selectedQuiosqueId, setSelectedQuiosqueId] = useState('');
    const [itemInventario, setItemInventario] = useState({ joiaId: '', quantidade: 1 });
    
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [lojasData, quiosquesData, vendedoresData, joiasData] = await Promise.all([
                getLojas(),
                getQuiosques(),
                getVendedores(),
                getJoias([]) // Passa lista vazia pois não precisamos do nome da categoria aqui
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

    const handleAddLoja = async (e) => {
        e.preventDefault();
        if (!nomeLoja) return;
        setLoading(true);
        try {
            const novaLoja = await addLoja(nomeLoja);
            setLojas(prev => [...prev, novaLoja]);
            setSuccess('Loja adicionada com sucesso!');
            setNomeLoja('');
        } catch (err) {
            setError('Erro ao adicionar loja.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuiosque = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const quiosqueData = { ...novoQuiosque, capacidade_joias: Number(novoQuiosque.capacidade_joias) };
            const quiosqueAdicionado = await addQuiosque(quiosqueData);
            setQuiosques(prev => [...prev, quiosqueAdicionado]);
            setSuccess('Quiosque adicionado com sucesso!');
            e.target.reset();
        } catch (err) {
            setError('Erro ao adicionar quiosque.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddInventario = async (e) => {
        e.preventDefault();
        if (!itemInventario.joiaId || !selectedQuiosqueId) return;
        setLoading(true);
        try {
            await addOrUpdateInventarioItem(selectedQuiosqueId, itemInventario.joiaId, itemInventario.quantidade);
            setSuccess('Inventário atualizado com sucesso!');
            // Atualiza a lista de inventário para refletir a adição
            await handleSelectQuiosque(selectedQuiosqueId); 
            setItemInventario({ joiaId: '', quantidade: 1 });
        } catch (err) {
            setError("Erro ao adicionar ao inventário.");
        } finally {
            setLoading(false);
        }
    };
    
    // --- NOVA FUNÇÃO PARA ATUALIZAR A ASSOCIAÇÃO DO VENDEDOR ---
    const handleAssociarVendedor = async (quiosqueId, vendedorId) => {
        setLoading(true);
        setSuccess('');
        setError('');
        try {
            await updateQuiosque(quiosqueId, { vendedorResponsavelId: vendedorId });
            setSuccess("Vendedor associado com sucesso!");
            fetchData(); // Recarrega os dados para refletir a mudança na lista
        } catch (err) {
            setError("Erro ao associar vendedor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Gerenciamento de Operações">
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            
            <details className="card" open>
                <summary>Adicionar Novas Lojas e Quiosques</summary>
                <div className="operations-grid">
                    <div className="operations-form">
                        <h3>Adicionar Nova Loja</h3>
                        <form onSubmit={handleAddLoja}>
                            <input type="text" placeholder="Nome da Loja (ex: Shopping Morumbi)" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} required />
                            <button type="submit" disabled={loading}>Adicionar Loja</button>
                        </form>
                    </div>
                    <div className="operations-form">
                        <h3>Adicionar Novo Quiosque</h3>
                        <form onSubmit={handleAddQuiosque}>
                            <input type="text" placeholder="Identificador (ex: QUIOSQUE-SP-01)" onChange={e => setNovoQuiosque({...novoQuiosque, identificador: e.target.value})} required />
                            <select onChange={e => setNovoQuiosque({...novoQuiosque, lojaId: e.target.value})} required>
                                <option value="">Selecione a Loja</option>
                                {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
                            </select>
                            <select onChange={e => setNovoQuiosque({...novoQuiosque, vendedorResponsavelId: e.target.value})}>
                                <option value="">Associe um Vendedor (Opcional)</option>
                                {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                            </select>
                            <input type="number" placeholder="Capacidade de Joias" defaultValue={50} onChange={e => setNovoQuiosque({...novoQuiosque, capacidade_joias: e.target.value})} required />
                            <button type="submit" disabled={loading}>Adicionar Quiosque</button>
                        </form>
                    </div>
                </div>
            </details>

            {/* --- NOVA SEÇÃO PARA GERENCIAR QUIOSQUES EXISTENTES --- */}
            <div className="card">
                <h3>Associar Vendedor a Quiosque</h3>
                <div className="quiosque-list">
                    {quiosques.map(q => (
                        <div key={q.id} className="quiosque-list-item">
                            <span>{q.identificador}</span>
                            <div className="quiosque-list-actions">
                                <select
                                    value={q.vendedorResponsavelId || ''}
                                    onChange={(e) => handleAssociarVendedor(q.id, e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">Nenhum Vendedor</option>
                                    {vendedores.map(v => (
                                        <option key={v.id} value={v.id}>{v.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
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
                                    <tr><th>Joia</th><th>SKU</th><th>Quantidade em Estoque</th><th>Ações</th></tr>
                                </thead>
                                <tbody>
                                    {inventario.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.joia?.nome || 'Joia não encontrada'}</td>
                                            <td>{item.joia?.sku || '-'}</td>
                                            <td>{item.quantidade}</td>
                                            <td><button className="action-button delete-button" disabled>Remover</button></td>
                                        </tr>
                                    ))}
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