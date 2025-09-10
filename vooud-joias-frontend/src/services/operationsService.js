import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- APRIMORADO: Agora verifica se a loja já existe antes de adicionar ---
export const addLoja = async (nomeLoja) => {
    // 1. Normaliza o nome para evitar duplicatas por maiúsculas/minúsculas
    const nomeNormalizado = nomeLoja.trim().toLowerCase();
    
    // 2. Faz uma busca para ver se já existe uma loja com esse nome
    const q = query(collection(db, "lojas"), where("nome_normalizado", "==", nomeNormalizado));
    const querySnapshot = await getDocs(q);

    // 3. Se a busca retornar algum resultado, lança um erro
    if (!querySnapshot.empty) {
        throw new Error(`A loja "${nomeLoja}" já está cadastrada.`);
    }

    // 4. Se não houver duplicatas, adiciona a nova loja
    const docRef = await addDoc(collection(db, "lojas"), { 
        nome: nomeLoja.trim(),
        nome_normalizado: nomeNormalizado 
    });
    return { id: docRef.id, nome: nomeLoja.trim() };
};

// --- NOVA FUNÇÃO: Atualiza o nome de uma loja ---
export const updateLoja = async (lojaId, novoNome) => {
    const nomeNormalizado = novoNome.trim().toLowerCase();
    const lojaRef = doc(db, "lojas", lojaId);
    await updateDoc(lojaRef, {
        nome: novoNome.trim(),
        nome_normalizado: nomeNormalizado
    });
};

// --- NOVA FUNÇÃO: Exclui uma loja ---
// CUIDADO: Esta função não verifica se há quiosques associados.
// Se uma loja for excluída, os quiosques podem ficar "órfãos".
export const deleteLoja = async (lojaId) => {
    await deleteDoc(doc(db, "lojas", lojaId));
};

// Busca todas as Lojas
export const getLojas = async () => {
    const snapshot = await getDocs(collection(db, "lojas"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Busca todos os Vendedores da coleção 'vendedores'
export const getVendedores = async () => {
    const q = query(collection(db, "vendedores"), where("role", "==", "vendedor"));
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

// Atualiza os dados de um quiosque (ex: associar vendedor)
export const updateQuiosque = async (quiosqueId, dataToUpdate) => {
    const quiosqueRef = doc(db, "quiosques", quiosqueId);
    await updateDoc(quiosqueRef, dataToUpdate);
};

// Busca todas as vendas e enriquece com dados do vendedor e quiosque
export const getVendasComDetalhes = async () => {
    const vendasSnapshot = await getDocs(collection(db, "vendas"));
    const vendas = vendasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const vendedoresSnapshot = await getDocs(collection(db, "vendedores"));
    const vendedoresMap = new Map(vendedoresSnapshot.docs.map(doc => [doc.id, doc.data()]));

    const quiosquesSnapshot = await getDocs(collection(db, "quiosques"));
    const quiosquesMap = new Map(quiosquesSnapshot.docs.map(doc => [doc.id, doc.data()]));

    return vendas.map(venda => ({
        ...venda,
        nomeVendedor: vendedoresMap.get(venda.vendedorId)?.nome || 'N/A',
        identificadorQuiosque: quiosquesMap.get(venda.quiosqueId)?.identificador || 'N/A',
    }));
};