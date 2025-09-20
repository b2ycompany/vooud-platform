import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify'; // ADICIONADO: Import do toast
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
        // Validação básica para garantir que imagens foram selecionadas ao criar
        if (!isEditing && !imagens) {
            toast.error("Por favor, adicione pelo menos uma imagem para a nova joia.");
            return;
        }
        const dataToSave = {
            ...joia,
            preco_venda: parseFloat(joia.preco_venda || 0),
            percentual_comissao: parseFloat(joia.percentual_comissao || 0)
        };
        onSave(dataToSave, imagens);
    };

    return (
        <form onSubmit={handleSubmit} className="stacked-form">
            <input type="text" placeholder="Nome da Joia" value={joia.nome || ''} onChange={(e) => setJoia({...joia, nome: e.target.value})} required className="input-field" />
            <input type="text" placeholder="SKU" value={joia.sku || ''} onChange={(e) => setJoia({...joia, sku: e.target.value})} required className="input-field" />
            <select value={joia.categoriaId || ''} onChange={(e) => setJoia({...joia, categoriaId: e.target.value})} required className="select-field">
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
                decimalSeparator=","
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
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                required
                className="input-field"
            />
            <label className="file-input-label">
                {!isEditing ? "Adicionar Imagens:" : "Mudar Imagens (opcional):"}
                <input type="file" multiple onChange={(e) => setImagens(e.target.files)} />
            </label>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-button" disabled={loading}>Cancelar</button>
                <button type="submit" className="save-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
        </form>
    );
};

const CatalogPage = () => {
    const [joias, setJoias] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    // REMOVIDO: const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentJoia, setCurrentJoia] = useState(null);
    const [loadingModal, setLoadingModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedCategorias = await getCategorias();
            setCategorias(fetchedCategorias);
            
            const fetchedJoias = await getJoias(fetchedCategorias);
            setJoias(fetchedJoias);
        } catch (err) {
            console.error("Erro detalhado ao carregar dados do catálogo:", err);
            toast.error("Falha ao carregar o catálogo. Tente novamente."); // ALTERADO
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
        try {
            if (joiaData.id) {
                await updateJoia(joiaData.id, joiaData, imagens);
                toast.success('Joia atualizada com sucesso!'); // ADICIONADO
            } else {
                await addJoiaWithImages(joiaData, imagens);
                toast.success('Joia adicionada com sucesso!'); // ADICIONADO
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Erro ao salvar a joia:", err);
            toast.error(err.message || "Ocorreu um erro ao salvar a joia."); // ALTERADO
        } finally {
            setLoadingModal(false);
        }
    };

    const handleDeleteJoia = async (joiaId) => {
        if (window.confirm("Tem certeza que deseja excluir esta joia?")) {
            setLoading(true);
            try {
                await deleteJoia(joiaId);
                toast.success("Joia excluída com sucesso!"); // ADICIONADO
                await fetchData();
            } catch (err) {
                console.error("Erro ao excluir joia:", err);
                toast.error("Ocorreu um erro ao excluir a joia."); // ALTERADO
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <AdminLayout title="Catálogo de Joias">
            {/* REMOVIDO: A exibição de 'loading' e 'error' que ficava aqui */}
            
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
                    <h2>Produtos Cadastrados</h2>
                    <button onClick={openModalForNew} className="add-button">Adicionar Nova Joia</button>
                </div>
                {loading ? (
                    <p>Carregando catálogo...</p>
                ) : (
                    <div className="table-responsive">
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
                                        <td>{joia.preco_venda?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td>{joia.percentual_comissao?.toFixed(2)}%</td>
                                        <td className="actions-cell">
                                            <button className="action-button edit-button" onClick={() => openModalForEdit(joia)}>Editar</button>
                                            <button className="action-button delete-button" onClick={() => handleDeleteJoia(joia.id)} disabled={loading}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CatalogPage;