console.log("Chat do aluno carregando");

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Config Firebase
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
const auth = getAuth();

const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// LOGIN DO ALUNO
const matricula = "654321"; // exemplo
const senha = "654321";     // senha = matrícula
const email = "junior@gmail.com"; // cria email fictício para login

signInWithEmailAndPassword(auth, email, senha)
  .then((userCredential) => {
    const alunoId = userCredential.user.uid;
    console.log("Logado como aluno:", alunoId);

    // Listener em tempo real para mensagens
    const mensagensRef = collection(db, "chats", alunoId, "mensagens");
    const q = query(mensagensRef, orderBy("timestamp"));

    onSnapshot(q, (snapshot) => {
      chatBox.innerHTML = "";
      snapshot.forEach(doc => {
        const m = doc.data();
        const div = document.createElement("div");
        div.textContent = `[${m.remetente}] ${m.texto}`;
        chatBox.appendChild(div);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Enviar mensagem
    sendBtn.addEventListener("click", async () => {
      const texto = msgInput.value.trim();
      if (!texto) return alert("Digite sua mensagem.");

      try {
        await addDoc(mensagensRef, {
          remetente: "aluno",
          texto,
          timestamp: serverTimestamp()
        });
        msgInput.value = "";
      } catch (erro) {
        console.error("Erro ao enviar mensagem:", erro);
        alert("Erro ao enviar mensagem.");
      }
    });
  })
  .catch((erro) => {
    console.error("Erro ao logar:", erro.message);
    alert("Erro no login do aluno. Verifique matrícula/senha.");
  });
