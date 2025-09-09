import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, runTransaction, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const getCategorias = async () => {
    const categoriasSnapshot = await getDocs(collection(db, "categorias"));
    return categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCategoria = async (nomeCategoria) => {
    const docRef = await addDoc(collection(db, "categorias"), { nome: nomeCategoria });
    return { id: docRef.id, nome: nomeCategoria };
};

export const getJoias = async (categoriasList) => {
    const joiasSnapshot = await getDocs(collection(db, "joias"));
    return joiasSnapshot.docs.map(doc => {
        const categoria = categoriasList.find(c => c.id === doc.data().categoriaId);
        return { id: doc.id, ...doc.data(), nomeCategoria: categoria ? categoria.nome : 'N/A' };
    });
};

export const deleteJoia = async (joiaId) => {
    // No futuro, adicionar lógica para deletar imagens do Storage aqui
    await deleteDoc(doc(db, "joias", joiaId));
};

export const addJoiaWithImages = async (joiaData, imagens) => {
    let joiaDocRef;
    
    // Transação para garantir que o SKU é único
    joiaDocRef = await runTransaction(db, async (transaction) => {
        const joiasCollectionRef = collection(db, "joias");
        const skuQuery = query(joiasCollectionRef, where("sku", "==", joiaData.sku));
        const skuSnapshot = await getDocs(skuQuery);

        if (!skuSnapshot.empty) {
            throw new Error(`O SKU "${joiaData.sku}" já está em uso.`);
        }
        
        const newDocRef = doc(joiasCollectionRef);
        transaction.set(newDocRef, { ...joiaData, data_criacao: serverTimestamp() });
        return newDocRef;
    });

    // Upload de imagens (fora da transação)
    const urlsImagens = await Promise.all(
        Array.from(imagens).map(imagem => {
            const imagemRef = ref(storage, `joias/${joiaDocRef.id}/${imagem.name}`);
            return uploadBytes(imagemRef, imagem).then(() => getDownloadURL(imagemRef));
        })
    );

    // Atualiza o documento com as URLs das imagens
    await updateDoc(joiaDocRef, {
        imagem_principal_url: urlsImagens[0],
        todas_imagens_urls: urlsImagens
    });
    
    return { id: joiaDocRef.id, ...joiaData };
};

export const updateJoia = async (joiaId, joiaData) => {
    const joiaRef = doc(db, "joias", joiaId);
    await updateDoc(joiaRef, joiaData);
    return { id: joiaId, ...joiaData };
};