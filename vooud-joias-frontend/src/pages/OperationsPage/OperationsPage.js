import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../components/AdminLayout/AdminLayout'; // 1. Importar o layout
import './OperationsPage.css';

const OperationsPage = () => {
    const [lojas, setLojas] = useState([]);
    const [quiosques, setQuiosques] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [nomeLoja, setNomeLoja] = useState('');
    const [novoQuiosque, setNovoQuiosque] = useState({
        identificador: '', lojaId: '', vendedorResponsavelId: '', capacidade_joias: 50
    });

    const fetchData = async () => {
        const lojasSnapshot = await getDocs(collection(db, "lojas"));
        setLojas(lojasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const quiosquesSnapshot = await getDocs(collection(db, "quiosques"));
        setQuiosques(quiosquesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const q = query(collection(db, "vendedores"), where("role", "==", "vendedor"));
        const vendedoresSnapshot = await getDocs(q);
        setVendedores(vendedoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddLoja = async (e) => {
        e.preventDefault();
        if (!nomeLoja) return;
        try {
            await addDoc(collection(db, "lojas"), { nome: nomeLoja });
            alert('Loja adicionada com sucesso!');
            fetchData();
            setNomeLoja('');
        } catch (error) {
            alert('Erro ao adicionar loja.');
        }
    };

    const handleAddQuiosque = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "quiosques"), {
                identificador: novoQuiosque.identificador,
                lojaId: novoQuiosque.lojaId,
                vendedorResponsavelId: novoQuiosque.vendedorResponsavelId,
                capacidade_joias: Number(novoQuiosque.capacidade_joias),
            });
            alert('Quiosque adicionado com sucesso!');
            fetchData();
        } catch (error) {
            alert('Erro ao adicionar quiosque.');
        }
    };
    
    return (
        // 2. Usar o AdminLayout, passando o título da página
        <AdminLayout title="Gerenciamento de Operações">
            <div className="operations-grid">
                <div className="operations-form">
                    <h3>Adicionar Nova Loja</h3>
                    <form onSubmit={handleAddLoja}>
                        <input type="text" placeholder="Nome da Loja (ex: Shopping Morumbi)" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} required />
                        <button type="submit">Adicionar Loja</button>
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
                        <select onChange={e => setNovoQuiosque({...novoQuiosque, vendedorResponsavelId: e.target.value})} required>
                            <option value="">Associe um Vendedor</option>
                            {vendedores.map(vendedor => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
                        </select>
                        <input type="number" placeholder="Capacidade de Joias" value={novoQuiosque.capacidade_joias} onChange={e => setNovoQuiosque({...novoQuiosque, capacidade_joias: e.target.value})} required />
                        <button type="submit">Adicionar Quiosque</button>
                    </form>
                </div>
            </div>
            <div className="operations-list">
                <h3>Quiosques Cadastrados</h3>
                <ul>
                    {quiosques.map(quiosque => <li key={quiosque.id}>{quiosque.identificador}</li>)}
                </ul>
            </div>
        </AdminLayout>
    );
};

export default OperationsPage;