console.log("JS carregado");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDaP9W95PzPQAIY44DayQ2rPjbzQ40oDU",
  authDomain: "teste-sistema-web-escola.firebaseapp.com",
  projectId: "teste-sistema-web-escola",
  storageBucket: "teste-sistema-web-escola.firebasestorage.app",
  messagingSenderId: "890927528513",
  appId: "1:890927528513:web:d1eb60c6d0fb97364ee4c0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formEvento = document.getElementById("formEvento");

formEvento.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Form submit detectado");

  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const data = document.getElementById("data").value;

  if (!titulo || !data) return alert("Preencha título e data.");

  try {
    await addDoc(collection(db, "eventosCalendario"), {
      titulo,
      descricao,
      data,
      criadoEm: serverTimestamp()
    });
    alert("Evento cadastrado com sucesso!");
    formEvento.reset();
  } catch (erro) {
    console.error("Erro ao cadastrar evento:", erro);
    alert("Erro ao cadastrar evento.");
  }
});
