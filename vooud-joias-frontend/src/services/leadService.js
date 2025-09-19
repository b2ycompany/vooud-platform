import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Salva um novo lead (potencial cliente) no banco de dados.
 * @param {object} leadData - Os dados do lead (nome, email, whatsapp).
 */
export const addLead = async (leadData) => {
    try {
        await addDoc(collection(db, "leads"), {
            ...leadData,
            data_captura: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar o lead:", error);
        return { success: false, error: "Não foi possível registrar seu contato. Tente novamente." };
    }
};