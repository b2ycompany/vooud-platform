import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import SplashScreen from '../components/SplashScreen/SplashScreen';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [splashTimer, setSplashTimer] = useState(true);

    const fetchAndSetUser = async (firebaseUser) => {
        if (firebaseUser) {
            // CORREÇÃO CRÍTICA: Tenta buscar na coleção de administradores primeiro
            const adminDocRef = doc(db, "administradores", firebaseUser.uid);
            const adminDocSnap = await getDoc(adminDocRef);

            if (adminDocSnap.exists()) {
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...adminDocSnap.data() });
            } else {
                // Se não for admin, tenta buscar na coleção de vendedores
                const userDocRef = doc(db, "vendedores", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDocSnap.data() });
                } else {
                    setUser(firebaseUser); // Caso não encontre em nenhuma
                }
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            await fetchAndSetUser(firebaseUser);
            setAuthLoading(false);
        });

        const timer = setTimeout(() => {
            setSplashTimer(false);
        }, 1500); // 1.5 segundos

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const registerUser = async (email, password, nome) => {
        let userCredential = null;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "vendedores", userCredential.user.uid), {
                nomeCompleto: nome,
                quiosqueId: null,
                role: 'vendedor',
                associado: false,
            });
            return { success: true };
        } catch (error) {
            let friendlyMessage = "Ocorreu um erro ao criar a conta.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este e-mail já está em uso. Tente outro.";
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Verifica o perfil do usuário imediatamente após o login
            const adminDocSnap = await getDoc(doc(db, "administradores", userCredential.user.uid));
            const userDocSnap = await getDoc(doc(db, "vendedores", userCredential.user.uid));

            if (userDocSnap.exists() && userDocSnap.data().associado === false && userDocSnap.data().role !== 'administrador') {
                 // Bloqueia o login se não for admin e não estiver associado
                return { success: false, error: "Sua conta ainda não foi associada a um quiosque. Por favor, aguarde a aprovação do administrador." };
            }

            await fetchAndSetUser(userCredential.user);
            return { success: true };
        } catch (error) {
            let friendlyMessage = "Ocorreu um erro ao fazer login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                friendlyMessage = "E-mail ou senha inválidos.";
            }
            return { success: false, error: friendlyMessage };
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
    };

    const contextData = {
        user: user,
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