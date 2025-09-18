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
            <input type="text" placeholder="SKU" value={joia.sku || ''} onChange={(e) => setJoia({...joia, sku: e.target.value})} required />
            <select value={joia.categoriaId || ''} onChange={(e) => setJoia({...joia, categoriaId: e.target.value})} required>
                <option value="">Selecione uma Categoria</option>
                {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
            </select>
            <NumericFormat
                placeholder="Preço de Venda"
                value={joia.preco_venda || ''}
                onValueChange={(values) => setJoia({...joia, preco_venda: values.value})}
                prefix="R$ "
                thousandSeparator="."
                decimalScale={2}
                fixedDecimalScale
                required
                className="input-field"
            />
            <NumericFormat
                placeholder="Percentual de Comissão"
                value={joia.percentual_comissao || ''}
                onValueChange={(values) => setJoia({...joia, percentual_comissao: values.value})}
                suffix=" %"
                decimalScale={2}
                fixedDecimalScale
                required
                className="input-field"
            />
            <label>
                {!isEditing ? "Adicionar Imagens:" : "Mudar Imagens (opcional):"}
                <input type="file" multiple onChange={(e) => setImagens(e.target.files)} />
            </label>
            <div className="modal-actions">
                <button type="submit" className="action-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                <button type="button" onClick={onCancel} className="cancel-button" disabled={loading}>Cancelar</button>
            </div>
        </form>
    );
};

const CatalogPage = () => {
    const [joias, setJoias] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentJoia, setCurrentJoia] = useState(null);
    const [loadingModal, setLoadingModal] = useState(false);

    // Adicionado useCallback para memoizar a função e evitar loops infinitos no useEffect
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // CORREÇÃO CRÍTICA: Carregando categorias primeiro
            const fetchedCategorias = await getCategorias();
            setCategorias(fetchedCategorias);
            
            // CORREÇÃO CRÍTICA: Passando as categorias para o getJoias
            const fetchedJoias = await getJoias(fetchedCategorias);
            setJoias(fetchedJoias);
        } catch (err) {
            console.error("Erro detalhado ao carregar dados do catálogo:", err);
            setError("Falha ao carregar as joias ou categorias. Por favor, tente novamente.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModalForNew = () => {
        setCurrentJoia(null);
        setIsModalOpen(true);
    };

    const openModalForEdit = (joia) => {
        setCurrentJoia(joia);
        setIsModalOpen(true);
    };

    const handleSaveJoia = async (joiaData, imagens) => {
        setLoadingModal(true);
        setError('');
        try {
            if (joiaData.id) {
                await updateJoia(joiaData.id, joiaData, imagens);
            } else {
                await addJoiaWithImages(joiaData, imagens);
            }
            await fetchData(); // Recarrega os dados após a operação
            setIsModalOpen(false);
        } catch (err) {
            console.error("Erro ao salvar a joia:", err);
            setError(err.message || "Ocorreu um erro ao salvar a joia.");
        } finally {
            setLoadingModal(false);
        }
    };

    const handleDeleteJoia = async (joiaId) => {
        if (window.confirm("Tem certeza que deseja excluir esta joia?")) {
            setLoading(true);
            try {
                await deleteJoia(joiaId);
                await fetchData(); // Recarrega os dados após a exclusão
            } catch (err) {
                console.error("Erro ao excluir joia:", err);
                setError("Ocorreu um erro ao excluir a joia.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <AdminLayout title="Catálogo de Joias">
            {loading && <p className="loading-message">Carregando dados...</p>}
            {error && <p className="error-message">{error}</p>}
            
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentJoia ? 'Editar Joia' : 'Adicionar Nova Joia'}>
                <JoiaForm 
                    onSave={handleSaveJoia} 
                    categorias={categorias} 
                    initialData={currentJoia || {}} 
                    onCancel={() => setIsModalOpen(false)} 
                    loading={loadingModal} 
                />
            </Modal>

            <div className="catalog-container">
                <div className="catalog-header">
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