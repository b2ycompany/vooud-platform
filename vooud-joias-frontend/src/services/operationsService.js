import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';

// Busca todas as Lojas
export const getLojas = async () => {
    const snapshot = await getDocs(collection(db, "lojas"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Adiciona uma nova Loja
export const addLoja = async (nomeLoja) => {
    const docRef = await addDoc(collection(db, "lojas"), { nome: nomeLoja });
    return { id: docRef.id, nome: nomeLoja };
};

// Busca todos os Quiosques
export const getQuiosques = async () => {
    const snapshot = await getDocs(collection(db, "quiosques"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Adiciona um novo Quiosque
export const addQuiosque = async (quiosqueData) => {
    const docRef = await addDoc(collection(db, "quiosques"), quiosqueData);
    return { id: docRef.id, ...quiosqueData };
};

// Busca todos os Vendedores (usuários com role 'vendedor')
export const getVendedores = async () => {
    // --- MODIFICADO PARA BUSCAR USUÁRIOS ---
    const q = query(collection(db, "usuarios"), where("role", "==", "vendedor"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Busca o inventário de um Quiosque específico
export const getInventarioForQuiosque = async (quiosqueId, joiasList) => {
    if (!quiosqueId) return [];
    const q = query(collection(db, "inventario"), where("quiosqueId", "==", quiosqueId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const joia = joiasList.find(j => j.id === doc.data().joiaId);
        return { id: doc.id, ...doc.data(), joia: joia || {} };
    });
};

// Adiciona ou atualiza um item no inventário
export const addOrUpdateInventarioItem = async (quiosqueId, joiaId, quantidade) => {
    const q = query(collection(db, "inventario"), where("quiosqueId", "==", quiosqueId), where("joiaId", "==", joiaId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const itemExistente = snapshot.docs[0];
        const itemRef = doc(db, "inventario", itemExistente.id);
        const novaQuantidade = itemExistente.data().quantidade + Number(quantidade);
        await updateDoc(itemRef, { quantidade: novaQuantidade });
    } else {
        await addDoc(collection(db, "inventario"), {
            quiosqueId: quiosqueId,
            joiaId: joiaId,
            quantidade: Number(quantidade)
        });
    }
};

// --- FUNÇÃO NOVA ---
// Atualiza os dados de um quiosque (ex: associar vendedor)
export const updateQuiosque = async (quiosqueId, dataToUpdate) => {
    const quiosqueRef = doc(db, "quiosques", quiosqueId);
    await updateDoc(quiosqueRef, dataToUpdate);
};

// --- FUNÇÃO NOVA ---
// Busca todas as vendas e enriquece com dados do vendedor e quiosque
export const getVendasComDetalhes = async () => {
    const vendasSnapshot = await getDocs(collection(db, "vendas"));
    const vendas = vendasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Para evitar múltiplas buscas, pegamos todos os vendedores e quiosques uma vez
    const vendedoresSnapshot = await getDocs(collection(db, "usuarios"));
    const vendedoresMap = new Map(vendedoresSnapshot.docs.map(doc => [doc.id, doc.data()]));

    const quiosquesSnapshot = await getDocs(collection(db, "quiosques"));
    const quiosquesMap = new Map(quiosquesSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // Adiciona os nomes aos dados de venda
    return vendas.map(venda => ({
        ...venda,
        nomeVendedor: vendedoresMap.get(venda.vendedorId)?.nome || 'N/A',
        identificadorQuiosque: quiosquesMap.get(venda.quiosqueId)?.identificador || 'N/A',
    }));
};