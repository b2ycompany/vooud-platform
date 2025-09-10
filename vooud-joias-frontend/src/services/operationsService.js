import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- CRUD Lojas ---
export const addLoja = async (nomeLoja) => {
    const nomeNormalizado = nomeLoja.trim().toLowerCase();
    const q = query(collection(db, "lojas"), where("nome_normalizado", "==", nomeNormalizado));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error(`A loja "${nomeLoja}" já está cadastrada.`);
    }
    const docRef = await addDoc(collection(db, "lojas"), { 
        nome: nomeLoja.trim(),
        nome_normalizado: nomeNormalizado 
    });
    return { id: docRef.id, nome: nomeLoja.trim() };
};

export const updateLoja = async (lojaId, novoNome) => {
    const nomeNormalizado = novoNome.trim().toLowerCase();
    const lojaRef = doc(db, "lojas", lojaId);
    await updateDoc(lojaRef, {
        nome: novoNome.trim(),
        nome_normalizado: nomeNormalizado
    });
};

export const deleteLoja = async (lojaId) => {
    await deleteDoc(doc(db, "lojas", lojaId));
};

export const getLojas = async () => {
    const snapshot = await getDocs(collection(db, "lojas"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- CRUD Quiosques ---

// APRIMORADO: Agora verifica se o identificador do quiosque já existe
export const addQuiosque = async (quiosqueData) => {
    const identificador = quiosqueData.identificador.trim().toUpperCase();
    const q = query(collection(db, "quiosques"), where("identificador", "==", identificador));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error(`O identificador "${identificador}" já está em uso.`);
    }

    const docRef = await addDoc(collection(db, "quiosques"), {
        ...quiosqueData,
        identificador: identificador,
        capacidade_joias: Number(quiosqueData.capacidade_joias)
    });
    return { id: docRef.id, ...quiosqueData, identificador };
};

// APRIMORADO: Atualiza os dados de um quiosque com normalização
export const updateQuiosque = async (quiosqueId, dataToUpdate) => {
    const quiosqueRef = doc(db, "quiosques", quiosqueId);
    // Garante que os dados enviados para o banco de dados estejam no formato correto
    const dadosFormatados = {
        ...dataToUpdate,
        identificador: dataToUpdate.identificador.trim().toUpperCase(),
        capacidade_joias: Number(dataToUpdate.capacidade_joias)
    };
    await updateDoc(quiosqueRef, dadosFormatados);
};

// NOVO: Deleta um quiosque
export const deleteQuiosque = async (quiosqueId) => {
    // CUIDADO: Esta ação pode deixar registros de inventário órfãos.
    await deleteDoc(doc(db, "quiosques", quiosqueId));
};

export const getQuiosques = async () => {
    const snapshot = await getDocs(collection(db, "quiosques"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


// --- Outros Serviços ---

export const getVendedores = async () => {
    const q = query(collection(db, "vendedores"), where("role", "==", "vendedor"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getInventarioForQuiosque = async (quiosqueId, joiasList) => {
    if (!quiosqueId) return [];
    const q = query(collection(db, "inventario"), where("quiosqueId", "==", quiosqueId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const joia = joiasList.find(j => j.id === doc.data().joiaId);
        return { id: doc.id, ...doc.data(), joia: joia || {} };
    });
};

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