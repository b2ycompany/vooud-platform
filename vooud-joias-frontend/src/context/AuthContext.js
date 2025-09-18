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
    const [authLoading, setAuthLoading] = useState(true); // Controla o carregamento do Firebase
    const [splashTimer, setSplashTimer] = useState(true); // Controla o seu timer

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Tenta buscar como administrador primeiro
                    const adminDocRef = doc(db, "administradores", firebaseUser.uid);
                    const adminDocSnap = await getDoc(adminDocRef);

                    if (adminDocSnap.exists()) {
                        const adminProfile = { uid: firebaseUser.uid, email: firebaseUser.email, ...adminDocSnap.data() };
                        
                        // LOG DE DIAGNÓSTICO ADICIONADO
                        console.log("Perfil de Administrador encontrado. Definindo usuário como:", adminProfile);
                        
                        setUser(adminProfile);
                    } else {
                        // Se não for admin, busca como vendedor
                        const userDocRef = doc(db, "vendedores", firebaseUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const vendedorProfile = { uid: firebaseUser.uid, email: firebaseUser.email, ...userDocSnap.data() };
                            console.log("Perfil de Vendedor encontrado. Definindo usuário como:", vendedorProfile);
                            setUser(vendedorProfile);
                        } else {
                            throw new Error("Perfil de usuário não encontrado no Firestore.");
                        }
                    }
                } catch (error) {
                    console.error("Erro ao buscar perfil do usuário, deslogando:", error);
                    await signOut(auth);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setAuthLoading(false); // Finaliza o carregamento do Firebase
        });

        // Seu timer de 5 segundos restaurado
        const timer = setTimeout(() => {
            setSplashTimer(false);
        }, 5000); // 5000 milissegundos

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
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
                associado: false,
                data_criacao: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            if (userCredential) await deleteUser(userCredential.user); // Rollback
            let friendlyMessage = "Ocorreu um erro ao criar a conta.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "A senha é muito fraca.";
            }
            console.error("Erro no registro:", error);
            return { success: false, error: friendlyMessage };
        }
    };

    const loginUser = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error("Erro no login:", error.code);
            return { success: false, error: "E-mail ou senha inválidos." };
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
    };

    const contextData = {
        user,
        // O loading geral agora depende tanto do auth quanto do seu timer
        loading: authLoading || splashTimer,
        registerUser,
        loginUser,
        logoutUser,
    };

    if (authLoading || splashTimer) {
        return <SplashScreen />;
    }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};