import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
import SplashScreen from '../components/SplashScreen/SplashScreen';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // ==================================================================
            // CORREÇÃO E ADIÇÃO DO CATCH PARA REVELAR O ERRO
            // ==================================================================
            try {
                if (firebaseUser) {
                    // Se um usuário do Firebase for detectado, buscamos seus dados no Firestore
                    const userDocRef = doc(db, "vendedores", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists() && userDocSnap.data().role) {
                        // Combina os dados de autenticação com os dados do Firestore
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDocSnap.data() });
                    } else {
                        // Se o documento não existir ou não tiver a 'role', lançamos um erro claro.
                        // Isso força o CATCH a ser ativado e nos mostra o problema.
                        throw new Error(`Documento do usuário (UID: ${firebaseUser.uid}) não encontrado ou sem o campo 'role' na coleção 'vendedores'.`);
                    }
                } else {
                    // Se não há usuário, o estado é nulo
                    setUser(null);
                }
            } catch (error) {
                // ESTE CATCH VAI CAPTURAR O ERRO E NOS MOSTRAR NO CONSOLE
                console.error("ERRO CRÍTICO AO TENTAR OBTER DADOS DO USUÁRIO:", error);
                
                // Se a busca de dados falhar, deslogamos o usuário para evitar um estado inconsistente
                // e garantir que ele não fique "preso" em um limbo.
                await signOut(auth);
                setUser(null);
            } finally {
                // Finaliza o estado de carregamento inicial, aconteça o que acontecer
                setLoading(false);
            }
            // ==================================================================
        });

        return unsubscribe;
    }, []);

    const registerUser = async (email, password, nome) => {
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            
            await setDoc(doc(db, "vendedores", newUser.uid), {
                uid: newUser.uid,
                nome: nome,
                email: email,
                role: 'vendedor',
                data_criacao: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            let friendlyMessage = "Ocorreu um erro ao registrar.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este endereço de e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "A senha é muito fraca. Tente uma mais forte.";
            }
            console.error("Erro no registro:", error);
            if (userCredential) {
                await deleteUser(userCredential.user);
            }
            return { success: false, error: friendlyMessage };
        }
    };

    const loginUser = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            let friendlyMessage = "Ocorreu um erro ao fazer login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                friendlyMessage = "E-mail ou senha inválidos.";
            }
            console.error("Erro no login:", error.code);
            return { success: false, error: friendlyMessage };
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
    };

    const value = {
        user,
        loading,
        registerUser,
        loginUser,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <SplashScreen /> : children}
        </AuthContext.Provider>
    );
};