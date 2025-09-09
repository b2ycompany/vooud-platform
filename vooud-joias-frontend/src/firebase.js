// Importa as funções que vamos precisar do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Adicione o objeto de configuração do seu projeto Firebase aqui
// COLE AQUI O OBJETO firebaseConfig QUE VOCÊ COPIOU DO SITE DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB_KLK6BCCBhDkyjeGIp4V9HXYbf5FOAIM",
  authDomain: "vooud-joias-platform.firebaseapp.com",
  projectId: "vooud-joias-platform",
  storageBucket: "vooud-joias-platform.firebasestorage.app",
  messagingSenderId: "1019275470488",
  appId: "1:1019275470488:web:36f23243f5e9fe909a52ed"
};
// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase que usaremos em outras partes do nosso aplicativo
export const auth = getAuth(app);
export const db = getFirestore(app);