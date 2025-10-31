import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"; 
import { auth, db } from "./firebase.js";
import { collection, addDoc, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {renderizarCardsAlunos, adicionarListenersNosCards} from './ui.js';

// Cadastro de Usuário 

const botaoCadastro = document.getElementById("bottun_cadastro");

if(botaoCadastro){
    botaoCadastro.addEventListener("click", cadastrarUsuario);
}
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
        await setDoc(doc(db, "usuarios", user.uid), {
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

//Login de Usuário 
const botaoLogin = document.getElementById("bottun_login");

if(botaoLogin){
    botaoLogin.addEventListener("click", fazerLogin);
}
async function fazerLogin(e){
    e.preventDefault();

    const emailElemento = document.getElementById("input_email_login");
    const senhaElemento = document.getElementById("input_senha_login");
    const emailValue = emailElemento.value;
    const senhaValue = senhaElemento.value;

    if (!emailValue.trim() || !senhaValue.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
    } 
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailValue, senhaValue);
        const user = userCredential.user;
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        let targetPage = ""; 

        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("Dados do usuário:", userData);
            const role = userData.role;
            if (role === "admin") {
                window.location.href = "PAGINA_ADM/admin_pagina.html"; //ADM
            } else {
                window.location.href = "PAGINAS_WEB/user_pagina.html"; //RESPOSÁVEL
            }
        } else {
            console.log("Nenhum dado encontrado para este usuário!");
            targetPage = "PAGINAS_WEB/user_pagina.html";
        }
        
        if (targetPage) {
            console.log("Login realizado com sucesso! Redirecionando...");
            window.location.href = targetPage;
        }
        
        emailElemento.value = "";
        senhaElemento.value = "";
    }
    catch (error) {
        console.error("Erro ao fazer login, tente novamente. " + error.message);
        alert("Erro ao fazer login, tente novamente. " + error.message);
    }
}

export function inicializarPaginaUser() {
    // Usa onAuthStateChanged para garantir que o usuário está logado
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userId = user.uid;
    
            const alunos = await getAlunosDoResponsavel(userId); 

            if (alunos.length > 0) {
                renderizarCardsAlunos(alunos);
                adicionarListenersNosCards();
            } else {
                console.log("Nenhum aluno encontrado para este responsável.");
        }
            
        } else {
            window.location.href = "../login.html"; 
        }
    });
}