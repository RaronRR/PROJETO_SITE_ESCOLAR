console.log("Tá rodando");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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

const alunoSelect = document.getElementById("alunoSelect");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let unsubscribe = null;

alunoSelect.addEventListener("change", () => {
  if (unsubscribe) unsubscribe(); // para listener anterior
  chatBox.innerHTML = "";

  const matricula = alunoSelect.value.trim();
  if (!matricula) return;

  const mensagensRef = collection(db, "chats", matricula, "mensagens");
  const q = query(mensagensRef, orderBy("timestamp"));

  unsubscribe = onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach(doc => {
      const m = doc.data();
      const div = document.createElement("div");
      div.textContent = `[${m.remetente}] ${m.texto}`;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
});

sendBtn.addEventListener("click", async () => {
  const matricula = alunoSelect.value.trim();
  const texto = msgInput.value.trim();
  if (!matricula || !texto) return alert("Selecione aluno e escreva a mensagem.");

  const mensagensRef = collection(db, "chats", matricula, "mensagens");
  await addDoc(mensagensRef, { remetente: "admin", texto, timestamp: serverTimestamp() });
  msgInput.value = "";
});
