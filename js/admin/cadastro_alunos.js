// js/admin/cadastro_alunos.js - CÓDIGO COMPLETO CORRIGIDO
import { db } from '../firebase.js';
import { doc, setDoc, getDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

class CadastroAlunos {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById("formCadastro");
        
        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
        } else {
            console.error("❌ FORMULÁRIO NÃO ENCONTRADO!");
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const dados = {
            nome: document.getElementById("input_nome_cadastro").value.trim(),
            telefone: document.getElementById("input_tel_cadastro").value.trim(),
            email: document.getElementById("input_email_cadastro").value.trim(),
            ano: document.getElementById("ano").value,
            classe: document.getElementById("classe").value,
            matricula: document.getElementById("input_matricula_aluno").value.trim()
        };


        // Validação
        if (!dados.matricula) {
            alert("Informe a matrícula do aluno!");
            return;
        }
        if (!dados.email) {
            alert("Informe o email do responsável!");
            return;
        }

        try {
            const resultado = await this.cadastrarAluno(dados);
            this.mostrarSucesso(dados, resultado);
            this.limparFormulario();
        } catch (error) {
            this.mostrarErro(error);
        }
    }

    async cadastrarAluno(dados) {
        
        // 1. Verifica se o responsável JÁ EXISTE no sistema
        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("email", "==", dados.email));
        const querySnapshot = await getDocs(q);
        
        let responsibleUID = null;
        let nomeResponsavel = "Não vinculado";

        if (!querySnapshot.empty) {
            // Responsável já existe - pega os dados
            const usuarioDoc = querySnapshot.docs[0];
            responsibleUID = usuarioDoc.id;
            nomeResponsavel = usuarioDoc.data().nome;
        } else {
            console.log("⚠️ Responsável não encontrado - aluno será 'pendente'");
        }

        // 2. Verifica se matrícula já existe
        console.log("Verificando se matrícula já existe...");
        const alunoRef = doc(db, "alunos", dados.matricula);
        const alunoSnap = await getDoc(alunoRef);

        if (alunoSnap.exists()) {
            throw new Error("Matrícula já cadastrada!");
        }

        // 3. Salva o aluno
        await setDoc(alunoRef, {
            nomeAluno: dados.nome,
            telefone: dados.telefone,
            emailResponsavel: dados.email,
            emailResponseAvel: dados.email,
            ano: dados.ano,
            classe: dados.classe,
            matricula: dados.matricula,
            criadoEm: new Date(),
            nomeResponsavel: nomeResponsavel,
            responsibleUID: responsibleUID,
            status: responsibleUID ? "vinculado" : "pendente"
        });

        console.log("✅ Aluno salvo com sucesso!");

        return { 
            success: true, 
            matricula: dados.matricula,
            vinculado: !!responsibleUID
        };
    }

    mostrarSucesso(dados, resultado) {
        if (resultado.vinculado) {
            alert(`✅ Aluno cadastrado e VINCULADO ao responsável!\n\nMatrícula: ${dados.matricula}`);
        } else {
            alert(`📝 Aluno cadastrado!\n\nMatrícula: ${dados.matricula}\n\n⚠️ O responsável precisa se cadastrar no sistema com o email: ${dados.email} para visualizar este aluno.`);
        }
    }

    mostrarErro(error) {
        console.error("💥 Erro no cadastro:", error);
        
        if (error.message === "Matrícula já cadastrada!") {
            alert("❌ Matrícula já cadastrada! Use uma matrícula diferente.");
        } else {
            alert("❌ Erro ao cadastrar aluno: " + error.message);
        }
    }

    limparFormulario() {
        const form = document.getElementById("formCadastro");
        if (form) form.reset();
    }
}

new CadastroAlunos();