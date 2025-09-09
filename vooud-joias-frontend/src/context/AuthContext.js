import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import SplashScreen from '../components/SplashScreen/SplashScreen';

// O contexto continua o mesmo
const AuthContext = createContext();

// --- MELHORIA 1: ADICIONANDO O HOOK 'useAuth' ---
// Este hook simplifica o uso do contexto nos seus componentes
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [splashTimer, setSplashTimer] = useState(true);

    // --- MELHORIA 2: FUNÇÃO CENTRALIZADA PARA BUSCAR DADOS DO USUÁRIO ---
    // Evita repetição de código e garante que os dados do usuário estejam sempre completos
    const fetchAndSetUser = async (firebaseUser) => {
        if (firebaseUser) {
            // --- MELHORIA 3: UNIFICANDO O NOME DA COLEÇÃO ---
            // Padronizado para "usuarios". Mude para "vendedores" se for o padrão do seu projeto.
            const userDocRef = doc(db, "usuarios", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // Combina os dados do Firebase Auth com os dados do Firestore
                setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDocSnap.data() });
            } else {
                // Caso o usuário exista no Auth mas não no Firestore
                setUser(firebaseUser);
            }
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            await fetchAndSetUser(firebaseUser); // Usa a nova função centralizada
            setAuthLoading(false); // Avisa que a verificação do Firebase terminou
        });

        // --- MELHORIA 4: REDUZINDO O TEMPO DA SPLASH SCREEN ---
        // 2 segundos é um tempo mais agradável para o usuário
        const timer = setTimeout(() => {
            setSplashTimer(false);
        }, 2000); // Reduzido de 6000ms para 2000ms

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
            
            // Padronizando para a coleção "usuarios"
            await setDoc(doc(db, "usuarios", newUser.uid), {
                uid: newUser.uid,
                nome: nome,
                email: email,
                role: 'vendedor',
            });
            // Após registrar, busca os dados completos imediatamente
            await fetchAndSetUser(newUser);
            return { success: true };
        } catch (error) {
            // --- MELHORIA 5: TRATAMENTO DE ERRO MAIS AMIGÁVEL ---
            let friendlyMessage = "Ocorreu um erro ao registrar.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este endereço de e-mail já está em uso.";
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "A senha é muito fraca. Tente uma mais forte.";
            }
            console.error("Erro no registro:", error);
            if (userCredential) {
                await deleteUser(userCredential.user); // Tentativa de rollback
            }
            return { success: false, error: friendlyMessage };
        }
    };

    const loginUser = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Após o login, busca os dados completos imediatamente
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

// Remove a exportação default daqui para padronizar
// export default AuthContext;