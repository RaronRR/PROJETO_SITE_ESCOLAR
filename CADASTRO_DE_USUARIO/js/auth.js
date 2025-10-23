import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"; 
import { auth, db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const botaoCadastro = document.getElementById("bottun_cadastro");
botaoCadastro.addEventListener("click", cadastrarUsuario);

async function cadastrarUsuario(e) {
    e.preventDefault(); // Evita que a pagina seja recarregada

    const nomeElemento = document.getElementById("input_nome_cadastro");
    const emailElemento = document.getElementById("input_email_cadastro");
    const senhaElemento = document.getElementById("input_senha_cadastro");
    const numeroElemento = document.getElementById("input_tel_cadastro");
    
    const nomeValue = nomeElemento.value;
    const emailValue = emailElemento.value;
    const senhaValue = senhaElemento.value;
    const numeroValue = numeroElemento.value;

    if (!nomeValue.trim() || !emailValue.trim() || !senhaValue.trim() || !numeroValue.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
        // Verifica se algum campo está vazio, .trim() remove espaços em branco
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailValue, senhaValue);
        const user = userCredential.user;
        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nome: nomeValue,
            email: emailValue,
            numero: numeroValue,
            role: "usuario",
            criadoEm: new Date() //Mostra a data de criação do usuário
            //Pega as informações do usuário e adiciona "usuarios" no Firestore
        });
        alert("Usuário cadastrado com sucesso!");
        nomeElemento.value = "";
        emailElemento.value = "";
        numeroElemento.value = "";
    } catch (error) {
        console.error("Erro ao cadastrar usuário, tente novamente." + error.message);
        alert("Erro ao cadastrar usuário, tente novamente." + error.message);
    }
}


