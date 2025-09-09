import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './CatalogPage.css';

const CatalogPage = () => {
    const [categorias, setCategorias] = useState([]);
    const [joias, setJoias] = useState([]);

    // Estados para os formulários
    const [nomeCategoria, setNomeCategoria] = useState('');
    const [novaJoia, setNovaJoia] = useState({
        nome: '',
        sku: '',
        categoriaId: '',
        preco_venda: '',
        percentual_comissao: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Busca os dados do Firestore quando a página carrega
    useEffect(() => {
        const fetchData = async () => {
            // Busca categorias
            const categoriasSnapshot = await getDocs(collection(db, "categorias"));
            setCategorias(categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Busca joias
            const joiasSnapshot = await getDocs(collection(db, "joias"));
            setJoias(joiasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchData();
    }, []);

    const handleAddCategoria = async (e) => {
        e.preventDefault();
        if (!nomeCategoria) return;
        try {
            await addDoc(collection(db, "categorias"), { nome: nomeCategoria });
            alert('Categoria adicionada!');
            // Recarregar a página para ver a nova categoria na lista
            window.location.reload();
        } catch (error) {
            setError('Erro ao adicionar categoria.');
        }
    };

    const handleAddJoia = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "joias"), {
                nome: novaJoia.nome,
                sku: novaJoia.sku,
                categoriaId: novaJoia.categoriaId,
                preco_venda: parseFloat(novaJoia.preco_venda),
                percentual_comissao: parseFloat(novaJoia.percentual_comissao),
            });
            alert('Joia adicionada!');
            window.location.reload();
        } catch (error) {
            setError('Erro ao adicionar joia.');
        }
    };

    return (
        <div className="catalog-container">
            <h2>Gerenciamento de Catálogo</h2>

            <div className="catalog-grid">
                {/* Formulário de Categorias */}
                <div className="catalog-form">
                    <h3>Adicionar Nova Categoria</h3>
                    <form onSubmit={handleAddCategoria}>
                        <input
                            type="text"
                            placeholder="Nome da Categoria (ex: Anéis)"
                            value={nomeCategoria}
                            onChange={(e) => setNomeCategoria(e.target.value)}
                        />
                        <button type="submit">Adicionar Categoria</button>
                    </form>
                </div>

                {/* Formulário de Joias */}
                <div className="catalog-form">
                    <h3>Adicionar Nova Joia</h3>
                    <form onSubmit={handleAddJoia}>
                        <input type="text" placeholder="Nome da Joia" onChange={(e) => setNovaJoia({...novaJoia, nome: e.target.value})} required />
                        <input type="text" placeholder="SKU (Código Único)" onChange={(e) => setNovaJoia({...novaJoia, sku: e.target.value})} required />
                        <select onChange={(e) => setNovaJoia({...novaJoia, categoriaId: e.target.value})} required>
                            <option value="">Selecione uma Categoria</option>
                            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                        </select>
                        <input type="number" step="0.01" placeholder="Preço de Venda (ex: 299.90)" onChange={(e) => setNovaJoia({...novaJoia, preco_venda: e.target.value})} required />
                        <input type="number" step="0.01" placeholder="Comissão % (ex: 10.00)" onChange={(e) => setNovaJoia({...novaJoia, percentual_comissao: e.target.value})} required />
                        <button type="submit">Adicionar Joia</button>
                    </form>
                </div>
            </div>

             {/* Listagem (simples por enquanto) */}
            <div className="catalog-list">
                <h3>Joias Cadastradas</h3>
                <ul>
                    {joias.map(joia => <li key={joia.id}>{joia.nome} (SKU: {joia.sku})</li>)}
                </ul>
            </div>
        </div>
    );
};

export default CatalogPage;