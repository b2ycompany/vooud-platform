import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// --- CRUD Lojas ---
export const addLoja = async (nomeLoja) => {
    try {
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
    } catch (error) {
        console.error("Erro em addLoja:", error);
        throw error;
    }
};

export const updateLoja = async (lojaId, novoNome) => {
    try {
        const nomeNormalizado = novoNome.trim().toLowerCase();
        const lojaRef = doc(db, "lojas", lojaId);
        await updateDoc(lojaRef, {
            nome: novoNome.trim(),
            nome_normalizado: nomeNormalizado
        });
    } catch (error) {
        console.error("Erro em updateLoja:", error);
        throw error;
    }
};

export const deleteLoja = async (lojaId) => {
    try {
        await deleteDoc(doc(db, "lojas", lojaId));
    } catch (error) {
        console.error("Erro em deleteLoja:", error);
        throw error;
    }
};

export const getLojas = async () => {
    try {
        const snapshot = await getDocs(collection(db, "lojas"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro em getLojas:", error);
        throw error;
    }
};

// --- CRUD Quiosques ---
export const addQuiosque = async (quiosqueData) => {
    try {
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
    } catch (error) {
        console.error("Erro em addQuiosque:", error);
        throw error;
    }
};

export const updateQuiosque = async (quiosqueId, dataToUpdate) => {
    try {
        const quiosqueRef = doc(db, "quiosques", quiosqueId);
        const dadosFormatados = {
            ...dataToUpdate,
            identificador: dataToUpdate.identificador.trim().toUpperCase(),
            capacidade_joias: Number(dataToUpdate.capacidade_joias)
        };
        await updateDoc(quiosqueRef, dadosFormatados);
    } catch (error) {
        console.error("Erro em updateQuiosque:", error);
        throw error;
    }
};

export const deleteQuiosque = async (quiosqueId) => {
    try {
        await deleteDoc(doc(db, "quiosques", quiosqueId));
    } catch (error) {
        console.error("Erro em deleteQuiosque:", error);
        throw error;
    }
};

export const getQuiosques = async () => {
    try {
        const snapshot = await getDocs(collection(db, "quiosques"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro em getQuiosques:", error);
        throw error;
    }
};


// --- Serviços de Vendedores ---
export const getVendedores = async () => {
    try {
        const snapshot = await getDocs(collection(db, "vendedores"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro em getVendedores:", error);
        throw error;
    }
};

// FUNÇÃO RE-ADICIONADA PARA APROVAR VENDEDORES
export const approveVendedor = async (vendedorId, quiosqueId) => {
    try {
        const vendedorRef = doc(db, "vendedores", vendedorId);
        await updateDoc(vendedorRef, {
            associado: true,
            quiosqueId: quiosqueId
        });
    } catch (error) {
        console.error("Erro em approveVendedor:", error);
        throw error;
    }
};

// --- Serviços de Inventário e Vendas ---
export const getInventarioForQuiosque = async (quiosqueId, joiasList) => {
    try {
        if (!quiosqueId) return [];
        const q = query(collection(db, "inventario"), where("quiosqueId", "==", quiosqueId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const joia = joiasList.find(j => j.id === doc.data().joiaId);
            return { id: doc.id, ...doc.data(), joia: joia || {} };
        });
    } catch (error) {
        console.error("Erro em getInventarioForQuiosque:", error);
        throw error;
    }
};

export const addOrUpdateInventarioItem = async (quiosqueId, joiaId, quantidade) => {
    try {
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
    } catch (error) {
        console.error("Erro em addOrUpdateInventarioItem:", error);
        throw error;
    }
};

export const getVendasComDetalhes = async () => {
    try {
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
    } catch (error) {
        console.error("Erro em getVendasComDetalhes:", error);
        throw error;
    }
};

// ==================================================================
// NOVA FUNÇÃO PARA A PÁGINA DE VISÃO GERAL DE ESTOQUE
// ==================================================================
export const getAggregatedStock = async () => {
    try {
        // 1. Busca todos os dados necessários em paralelo para mais performance
        const [joiasSnapshot, inventarioSnapshot, quiosquesSnapshot] = await Promise.all([
            getDocs(collection(db, "joias")),
            getDocs(collection(db, "inventario")),
            getDocs(collection(db, "quiosques"))
        ]);

        // 2. Cria mapas para busca rápida de dados (muito mais eficiente que usar .find() em loops)
        const joiasMap = new Map(joiasSnapshot.docs.map(doc => [doc.id, doc.data()]));
        const quiosquesMap = new Map(quiosquesSnapshot.docs.map(doc => [doc.id, doc.data()]));

        const aggregatedStock = {};

        // 3. Processa cada item do inventário
        inventarioSnapshot.docs.forEach(doc => {
            const item = doc.data();
            const joiaDetails = joiasMap.get(item.joiaId);
            const quiosqueDetails = quiosquesMap.get(item.quiosqueId);

            // Se a joia correspondente não for encontrada, pula este item
            if (!joiaDetails) return;

            // Se for a primeira vez que vemos esta joia, inicializa seu registro
            if (!aggregatedStock[item.joiaId]) {
                aggregatedStock[item.joiaId] = {
                    id: item.joiaId,
                    nome: joiaDetails.nome,
                    sku: joiaDetails.sku,
                    totalEstoque: 0,
                    distribuicao: []
                };
            }

            // 4. Agrega os dados
            aggregatedStock[item.joiaId].totalEstoque += item.quantidade;
            aggregatedStock[item.joiaId].distribuicao.push({
                quiosqueId: item.quiosqueId,
                quiosqueNome: quiosqueDetails?.identificador || 'Quiosque Desconhecido',
                quantidade: item.quantidade
            });
        });

        // 5. Converte o objeto de volta para um array e retorna
        return Object.values(aggregatedStock);

    } catch (error) {
        console.error("Erro em getAggregatedStock:", error);
        throw error;
    }
};