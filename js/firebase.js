// js/firebase.js - SUA VERSÃO MANTIDA
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";

// SUA configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDu75OLG5FhxRMMV4Cj9-caEt9KglkSzW4",
  authDomain: "sistemacadastro-e4c2b.firebaseapp.com",
  projectId: "sistemacadastro-e4c2b",
  storageBucket: "sistemacadastro-e4c2b.firebasestorage.app",
  messagingSenderId: "365166535745",
  appId: "1:365166535745:web:3f6ef24676c89d77ee92c0",
  measurementId: "G-T8GZJ4K3HP"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exporta serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collections
export const alunosCollectionRef = collection(db, "alunos");
export const usuariosCollectionRef = collection(db, "usuarios");
export const comunicadosCollectionRef = collection(db, "comunicados");
export const eventosCollectionRef = collection(db, "eventosCalendario");
export const chatsCollectionRef = collection(db, "chats");

export default app;