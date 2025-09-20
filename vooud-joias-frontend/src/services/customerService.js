import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

/**
 * Busca clientes no Firestore cujo nome comece com o termo pesquisado.
 * @param {string} searchTerm - O termo para buscar.
 * @returns {Array} - Uma lista de clientes encontrados.
 */
export const searchClientes = async (searchTerm) => {
    try {
        if (!searchTerm) return [];
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const clientesRef = collection(db, "clientes");
        
        // Esta consulta busca nomes que começam com o termo pesquisado
        const q = query(clientesRef, 
            where('nome_lowercase', '>=', lowerCaseSearchTerm),
            where('nome_lowercase', '<=', lowerCaseSearchTerm + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
    }
};

/**
 * Adiciona um novo cliente ao Firestore.
 * @param {object} clienteData - Os dados do novo cliente.
 * @returns {object} - O documento do cliente recém-criado com seu ID.
 */
export const addCliente = async (clienteData) => {
    try {
        // Garante a criação do campo para a busca
        const nome_lowercase = clienteData.nome.toLowerCase();
        const docRef = await addDoc(collection(db, "clientes"), {
            ...clienteData,
            nome_lowercase,
            data_criacao: serverTimestamp()
        });
        return { id: docRef.id, ...clienteData, nome_lowercase };
    } catch (error) {
        console.error("Erro ao adicionar cliente:", error);
        throw error;
    }
};