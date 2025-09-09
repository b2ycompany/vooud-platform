import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import SplashScreen from '../components/SplashScreen/SplashScreen';

const AuthContext = createContext();
export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    
    // Vamos usar dois estados para controlar o carregamento
    const [authLoading, setAuthLoading] = useState(true); // Controla o carregamento do Firebase
    const [splashTimer, setSplashTimer] = useState(true); // Controla o tempo mínimo de exibição

    useEffect(() => {
        // Gatilho do Firebase: Ouve as mudanças de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "vendedores", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUser({ ...firebaseUser, ...userDocSnap.data() });
                } else {
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            // Avisa que a verificação do Firebase terminou
            setAuthLoading(false);
        });

        // Gatilho do Tempo: Garante que a splash fique visível por pelo menos 2 segundos
        const timer = setTimeout(() => {
            setSplashTimer(false);
        }, 6000);

        // Limpa os "ouvintes" quando o componente é desmontado
        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
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
            });
            return { success: true };
        } catch (error) {
            console.error("Erro no registro:", error);
            if (userCredential) {
                await deleteUser(userCredential.user);
            }
            return { success: false, error: error.message };
        }
    };

    const loginUser = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logoutUser = async () => {
        await signOut(auth);
    };

    const contextData = {
        user: user,
        // O 'loading' geral agora depende do loading de autenticação E do timer
        loading: authLoading || splashTimer,
        registerUser: registerUser,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    // A splash screen será exibida enquanto um dos dois gatilhos estiver ativo
    if (authLoading || splashTimer) {
        return <SplashScreen />;
    }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};