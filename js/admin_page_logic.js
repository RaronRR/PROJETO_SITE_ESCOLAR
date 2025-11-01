import { auth, db, alunosCollectionRef } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, addDoc, getDoc, doc, setDoc, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
    botaoCadastroAluno.addEventListener("click", cadastroAluno);
}
async function cadastroAluno(e) {

    e.preventDefault();

    const nomeAluno = document.getElementById("input_nome_aluno");
    const turmaAluno = document.getElementById("turma_aluno");
    const dataNascimento = document.getElementById("data_nascimento_aluno");
    const nomeResponsavel = document.getElementById("input_nome_responsavel");
    const emailResponsavel = document.getElementById("input_email_responsavel");

    const nomeAlunoValue = nomeAluno.value;
    const turmaValue = turmaAluno.value;
    const dataNascimentoValue = dataNascimento.value;
    const responsavelValeua = nomeResponsavel.value;
    const emailResponsavelValue = emailResponsavel.value;

    if (!nomeAlunoValue.trim() || !turmaValue.trim() || !dataNascimentoValue.trim() || !responsavelValeua.trim() || !emailResponsavelValue.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
        // Verifica se algum campo está vazio, .trim() remove espaços em branco
    }

    //buscar responsavel pelo Email 
    const responsavelQuery = query(
        collection(db, "usuario"),
        where("email", "==", emailResponsavelValue) //O email deve ser igual ao cadastrado
    );
    let responsibleUID = null;

    try{
        const querySnapshot = await getDocs(responsavelQuery);
        if(querySnapshot.empty){ 
         alert("Erro: Responsavel com o email não foi encontrado ou não existe!");
         return;
        }
        
        const responsavelDoc = querySnapshot.docs[0];
        responsibleUID = responsavelDoc.id;
    
    } catch(error){
        console.error("Error ao buscar responsavel: ", error)
        alert("Ocorreu um erro ao buscar o responsável. Verifique o console.");
        return
    }

    const dadosAlunos = {
        nomeAluno: nomeAlunoValue,
        turma: turmaValue,
        dataNascimento: dataNascimentoValue,
        nomeResponsavel: responsavelValeua,
        emailResponsavel: emailResponsavelValue,
        responsibleUID: responsibleUID,
        dataDeCadastro: new Date().toISOString()
    }

    try{
        const docRef = await addDoc(alunosCollectionRef, dadosAlunos);
        alert("Aluno cadastrado com sucesso! ID: " + docRef.id)

        nomeAluno.value = "";
        turmaAluno.value = "";
        dataNascimento.value = "";
        nomeResponsavel.value = "";
        emailResponsavel.value = "";
    } catch (error) {
        console.error("Erro ao adicionar documento: ", error);
        alert("Ocorreu um erro ao cadastrar o aluno. Verifique o CONSOLE.")
    }
}   