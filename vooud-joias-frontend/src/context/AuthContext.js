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
            if (firebaseUser) {
                // Tenta buscar como administrador primeiro
                const adminDocRef = doc(db, "administradores", firebaseUser.uid);
                const adminDocSnap = await getDoc(adminDocRef);

                if (adminDocSnap.exists()) {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...adminDocSnap.data() });
                } else {
                    // Se não for admin, busca como vendedor
                    const userDocRef = doc(db, "vendedores", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDocSnap.data() });
                    } else {
                        console.warn("Usuário autenticado, mas sem perfil no Firestore:", firebaseUser.uid);
                        setUser(firebaseUser); // Usuário existe no Auth, mas não no DB
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const registerUser = async (email, password, nome, enderecoLoja) => {
        let userCredential = null;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "vendedores", userCredential.user.uid), {
                nome: nome,
                email: email,
                enderecoLoja: enderecoLoja,
                quiosqueId: null,
                role: 'vendedor',
                associado: false, // Começa como não associado
                data_criacao: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            if (userCredential) await deleteUser(userCredential.user); // Rollback
            let friendlyMessage = "Ocorreu um erro ao criar a conta.";
            if (error.code === 'auth/email-already-in-use') friendlyMessage = "Este e-mail já está em uso.";
            if (error.code === 'auth/weak-password') friendlyMessage = "A senha é muito fraca.";
            console.error("Erro no registro:", error);
            return { success: false, error: friendlyMessage };
        }
    };

    const loginUser = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            let friendlyMessage = "E-mail ou senha inválidos.";
            console.error("Erro no login:", error.code);
            return { success: false, error: friendlyMessage };
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
    };

    const contextData = {
        user,
        loading,
        registerUser,
        loginUser,
        logoutUser,
    };

    // O SplashScreen é mostrado apenas durante o carregamento inicial
    if (loading) {
        return <SplashScreen />;
    }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};