// Import the functions you need from the SDKs you need
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDu75OLG5FhxRMMV4Cj9-caEt9KglkSzW4",
  authDomain: "sistemacadastro-e4c2b.firebaseapp.com",
  projectId: "sistemacadastro-e4c2b",
  storageBucket: "sistemacadastro-e4c2b.firebasestorage.app",
  messagingSenderId: "365166535745",
  appId: "1:365166535745:web:3f6ef24676c89d77ee92c0",
  measurementId: "G-T8GZJ4K3HP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const alunosCollectionRef = collection(db,"alunos");
