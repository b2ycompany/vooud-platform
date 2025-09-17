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

// ==================================================================
// CORREÇÃO AQUI: Adicionado ` = []` para definir um valor padrão.
// Isso evita o erro caso a função seja chamada sem passar a lista de categorias.
export const getJoias = async (categoriasList = []) => {
// ==================================================================
    const joiasSnapshot = await getDocs(collection(db, "joias"));
    return joiasSnapshot.docs.map(doc => {
        // Agora, se 'categoriasList' for uma lista vazia, o .find() apenas não encontrará nada,
        // sem quebrar a aplicação.
        const categoria = categoriasList.find(c => c.id === doc.data().categoriaId);
        return { id: doc.id, ...doc.data(), nomeCategoria: categoria ? categoria.nome : 'N/A' };
    });
};

export const deleteJoia = async (joiaId) => {
    await deleteDoc(doc(db, "joias", joiaId));
};

// --- FUNÇÃO DE UPLOAD ATUALIZADA PARA USAR A CLOUD FUNCTION ---
export const addJoiaWithImages = async (joiaData, imagens) => {
    // 1. Cria o documento da Joia no Firestore primeiro para obter um ID
    const joiaDocRef = await addDoc(collection(db, "joias"), {
        ...joiaData,
        data_criacao: serverTimestamp()
    });

    try {
        // 2. Faz o upload das imagens através da nossa nova API (Cloud Function)
        const urlsImagens = await Promise.all(
            Array.from(imagens).map(async (imagem) => {
                const formData = new FormData();
                formData.append(imagem.name, imagem);

                // URL da sua Cloud Function (verificada do seu log de deploy)
                const functionUrl = `https://uploadimage-3odxvlsczq-uc.a.run.app?joiaId=${joiaDocRef.id}`;

                // Usamos 'fetch' para enviar o arquivo para a Cloud Function
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

        // 3. Atualiza o documento da joia com as URLs das imagens
        await updateDoc(joiaDocRef, {
            imagem_principal_url: urlsImagens[0],
            todas_imagens_urls: urlsImagens
        });

        return { id: joiaDocRef.id, ...joiaData };

    } catch (uploadError) {
        // 4. Se o upload falhar, deletamos a joia que foi criada (rollback)
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