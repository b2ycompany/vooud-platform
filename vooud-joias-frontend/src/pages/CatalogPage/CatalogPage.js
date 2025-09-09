import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import Modal from '../../components/Modal/Modal';
import { NumericFormat } from 'react-number-format';
import {
    getCategorias,
    addCategoria,
    getJoias,
    addJoiaWithImages,
    updateJoia,
    deleteJoia
} from '../../services/catalogService';
import './CatalogPage.css';

const JoiaForm = ({ onSave, categorias, initialData = {}, onCancel, loading }) => {
    const [joia, setJoia] = useState(initialData);
    const [imagens, setImagens] = useState(null);
    const isEditing = !!initialData.id;

    useEffect(() => {
        setJoia(initialData);
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            ...joia,
            preco_venda: parseFloat(joia.preco_venda || 0),
            percentual_comissao: parseFloat(joia.percentual_comissao || 0)
        };
        onSave(dataToSave, imagens);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Nome da Joia" value={joia.nome || ''} onChange={(e) => setJoia({...joia, nome: e.target.value})} required />
            <input type="text" placeholder="SKU (Código Único)" value={joia.sku || ''} onChange={(e) => setJoia({...joia, sku: e.target.value})} required disabled={isEditing} />
            <select value={joia.categoriaId || ''} onChange={(e) => setJoia({...joia, categoriaId: e.target.value})} required>
                <option value="">Selecione uma Categoria</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </select>
            <NumericFormat
                className="input-field"
                placeholder="Preço de Venda (R$)"
                value={joia.preco_venda || ''}
                thousandSeparator="." decimalSeparator="," prefix="R$ "
                onValueChange={(values) => setJoia({...joia, preco_venda: values.floatValue})}
                required
            />
            <input
                type="number"
                step="0.01"
                placeholder="Comissão (%)"
                value={joia.percentual_comissao || ''}
                onChange={(e) => setJoia({...joia, percentual_comissao: e.target.value})}
                required
            />
            {!isEditing && (
                <>
                    <label>Imagens da Joia</label>
                    <input type="file" multiple onChange={(e) => setImagens(e.target.files)} required />
                </>
            )}
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-button" disabled={loading}>Cancelar</button>
                <button type="submit" className="save-button" disabled={loading}>{loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Joia')}</button>
            </div>
        </form>
    );
};

const CatalogPage = () => {
    const [categorias, setCategorias] = useState([]);
    const [joias, setJoias] = useState([]);
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJoia, setEditingJoia] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const catList = await getCategorias();
            setCategorias(catList);
            const joiaList = await getJoias(catList);
            setJoias(joiaList);
        } catch (err) {
            setError("Erro ao carregar dados do catálogo.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddCategoria = async (e) => {
        e.preventDefault();
        if (!nomeCategoria) return;
        setLoading(true);
        try {
            const newCategoria = await addCategoria(nomeCategoria);
            setCategorias(prev => [...prev, newCategoria]);
            setSuccess('Categoria adicionada!');
            setNomeCategoria('');
        } catch (err) {
            setError('Erro ao adicionar categoria.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveJoia = async (joiaData, imagens) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            if (editingJoia) {
                await updateJoia(editingJoia.id, joiaData);
                setSuccess('Joia atualizada com sucesso!');
            } else {
                await addJoiaWithImages(joiaData, imagens);
                setSuccess('Joia adicionada com sucesso!');
            }
            fetchData();
            closeModal();
        } catch (err) {
            setError(err.message || 'Ocorreu um erro ao salvar a joia.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJoia = async (joiaId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta joia?")) return;
        setLoading(true);
        try {
            await deleteJoia(joiaId);
            setSuccess('Joia excluída com sucesso!');
            fetchData();
        } catch (err) {
            setError('Erro ao excluir joia.');
        } finally {
            setLoading(false);
        }
    };

    const openModalForEdit = (joia) => {
        setEditingJoia(joia);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingJoia(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingJoia(null);
    };

    return (
        <AdminLayout title="Gerenciamento de Catálogo">
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <Modal show={isModalOpen} onClose={closeModal} title={editingJoia ? 'Editar Joia' : 'Adicionar Nova Joia'}>
                <JoiaForm
                    onSave={handleSaveJoia}
                    categorias={categorias}
                    initialData={editingJoia || {}}
                    onCancel={closeModal}
                    loading={loading}
                />
            </Modal>

            <div className="card">
                <h3>Categorias</h3>
                <form onSubmit={handleAddCategoria} className="category-form">
                    <input type="text" placeholder="Nome da Nova Categoria" value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} />
                    <button type="submit" disabled={loading}>{loading ? '...' : 'Adicionar'}</button>
                </form>
                <ul className="category-list">
                    {categorias.map(cat => (<li key={cat.id}>{cat.nome}</li>))}
                </ul>
            </div>

            <div className="card catalog-list">
                <div className="list-header">
                    <h3>Joias Cadastradas</h3>
                    <button onClick={openModalForNew} className="add-button">Adicionar Nova Joia</button>
                </div>
                <table>
                    <thead>
                        <tr><th>Imagem</th><th>Nome</th><th>SKU</th><th>Categoria</th><th>Preço (R$)</th><th>Comissão (%)</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        {joias.map(joia => (
                            <tr key={joia.id}>
                                <td><img src={joia.imagem_principal_url || 'https://via.placeholder.com/50'} alt={joia.nome} className="joia-thumbnail" /></td>
                                <td>{joia.nome}</td>
                                <td>{joia.sku}</td>
                                <td>{joia.nomeCategoria}</td>
                                <td>{joia.preco_venda?.toFixed(2)}</td>
                                <td>{joia.percentual_comissao?.toFixed(2)}</td>
                                <td>
                                    <button className="action-button edit-button" onClick={() => openModalForEdit(joia)}>Editar</button>
                                    <button className="action-button delete-button" onClick={() => handleDeleteJoia(joia.id)} disabled={loading}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default CatalogPage;