import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, runTransaction, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';

export const getCategorias = async () => {
    const categoriasSnapshot = await getDocs(collection(db, "categorias"));
    return categoriasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCategoria = async (nomeCategoria) => {
    const docRef = await addDoc(collection(db, "categorias"), { nome: nomeCategoria });
    return { id: docRef.id, nome: nomeCategoria };
};

export const getJoias = async (categoriasList = []) => {
    const joiasSnapshot = await getDocs(collection(db, "joias"));
    return joiasSnapshot.docs.map(doc => {
        const categoria = categoriasList.find(c => c.id === doc.data().categoriaId);
        return { id: doc.id, ...doc.data(), nomeCategoria: categoria ? categoria.nome : 'N/A' };
    });
};

export const deleteJoia = async (joiaId) => {
    await deleteDoc(doc(db, "joias", joiaId));
};

export const addJoiaWithImages = async (joiaData, imagens) => {
    const joiaDocRef = await addDoc(collection(db, "joias"), {
        ...joiaData,
        data_criacao: serverTimestamp()
    });

    try {
        const urlsImagens = await Promise.all(
            Array.from(imagens).map(async (imagem) => {
                const formData = new FormData();
                formData.append(imagem.name, imagem);

                const functionUrl = `https://uploadimage-3odxvlsczq-uc.a.run.app?joiaId=${joiaDocRef.id}`;

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Erro no servidor de upload.');
                }
                return data.imageUrl;
            })
        );

        await updateDoc(joiaDocRef, {
            imagem_principal_url: urlsImagens[0],
            todas_imagens_urls: urlsImagens
        });

        return { id: joiaDocRef.id, ...joiaData };

    } catch (uploadError) {
        await deleteDoc(doc(db, "joias", joiaDocRef.id));
        console.error("Upload falhou, joia desfeita (rollback).", uploadError);
        throw uploadError;
    }
};

export const updateJoia = async (joiaId, joiaData) => {
    const joiaRef = doc(db, "joias", joiaId);
    await updateDoc(joiaRef, joiaData);
    return { id: joiaId, ...joiaData };
};