import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Objeto de configuração com o storageBucket CORRIGIDO
const firebaseConfig = {
  apiKey: "AIzaSyB_KLK6BCCBhDkyjeGIp4V9HXYbf5FOAIM",
  authDomain: "vooud-joias-platform.firebaseapp.com",
  projectId: "vooud-joias-platform",
  storageBucket: "vooud-joias-platform.appspot.com", // <-- CORREÇÃO APLICADA
  messagingSenderId: "1019275470488",
  appId: "1:1019275470488:web:36f23243f5e9fe909a52ed"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);