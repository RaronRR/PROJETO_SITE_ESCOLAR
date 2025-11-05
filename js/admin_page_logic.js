import { auth, db } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";  

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuário está logado, agora checar a role no Firestore
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.role !== "admin") {
                // Se o usuário não for ADM, redirecionar para a página normal (Segurança!)
                console.log("Acesso negado. Não é administrador.");
                window.location.href = "../PAGINAS_WEB/user_pagina.html"; 
            } else {
                // Usuário é ADM, pode carregar o conteúdo da página
                console.log("Administrador logado. Conteúdo liberado.");
                // Você pode chamar aqui a função que exibe o formulário, etc.
            }
        } else {
            // Documento de usuário não encontrado (Erro na base de dados)
            window.location.href = "../index.html";
        }
    } else {
        // Usuário não está logado, redirecionar para a página de login
        window.location.href = "../index.html"; 
    }
});

//Cadastro de Aluno
const botaoCadastroAluno = document.getElementById("bottun_cadastro_Aluno")
if(botaoCadastroAluno){
    botaoCadastroAluno.addEventListener("click", cadastroAluno)
}
async function cadastroAluno(e) {
    console.log("tentativa de cadastro iniciado")
    e.preventDefault();

    const nomeAluno = document.getElementById("input_nome_aluno");
    const turmaAluno = document.getElementById("turma_aluno");
    const dataNascimento = document.getElementById("data_nascimento_aluno");
    const nomeResponsavel = document.getElementById("input_nome_responsavel");
    const emailResponsavel = document.getElementById("input_email_responsavel");

    const nomeAlunoValue = nomeAluno.value;
    const turmaValue = turmaAluno.value;
    const dataNascimentoValue = dataNascimento.value;
    const nomeResponsavelValue = nomeResponsavel.value;
    const emailResponsavelValue = emailResponsavel.value;

    if (!nomeAlunoValue.trim() || !turmaValue.trim() || !dataNascimentoValue.trim() || !nomeResponsavelValue.trim() || !emailResponsavelValue.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
        // Verifica se algum campo está vazio, .trim() remove espaços em branco
    }

    const dados = {
        nomeAluno: nomeAlunoValue,
        turma: turmaValue,
        dataNascimento: dataNascimentoValue,
        nomeResponsavel: nomeResponsavelValue,
        emailResponsavel: emailResponsavelValue
    }

    try{
        // ATENÇÃO: A URL ABAIXO É APENAS PARA TESTE LOCAL. 
        // Você usará esta URL quando for TESTAR no Terminal:
        // http://127.0.0.1:5001/SEU_PROJECT_ID/us-central1/cadastroAlunoAdmin
        // SUBSTITUA "SEU_PROJECT_ID" pelo ID REAL do seu projeto Firebase!
        
        const response = await fetch('https://us-central1-sistemacadastro-e4c2b.cloudfunctions.net/cadastroAlunoAdmin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if(response.ok) {
            alert("Aluno cadastrado com sucesso! A busca do responsável foi feita no Backend.")
            
            nomeAluno.value = "";
            turmaAluno.value = "";
            dataNascimento.value = "";
            nomeResponsavel.value = "";
            emailResponsavel.value = "";
        } else {
             const errorText = await response.text();
             alert("Erro ao cadastrar aluno: " + errorText);
             console.error("Erro do Backend:", errorText);
        }
    } catch (error){
        console.error("Erro na comunicação com o Backend: ", error);
        alert("Ocorreu um erro de rede ao tentar cadastrar o aluno.");
    }
}   

