//Area de importações:
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { addDoc, collection } from 'firebase/firestore';

// Função para cadastrar um novo aluno e associá a um responsável

const botaoCadastroAluno = document.getElementById("bottun_cadastro_aluno");
if(botaoCadastroAluno){
    botaoCadastroAluno.addEventListener("click", cadastrarAluno);
}
async function cadastrarAluno(e) {
    e.preventDefault(); // Evita que a pagina seja recarregada

    const nomeElemento = document.getElementById("input_nome_aluno");
    const dataNascimentoElemento = document.getElementById("data_nascimento_aluno");
    const turmaElemento = document.getElementById("input_turma_aluno");

    const nomeValue = nomeElemento.value;
    const dataNascimentoValue = dataNascimentoElemento.value;
    const turmaValue = turmaElemento.value;

    if (!nomeValue.trim() || !dataNascimentoValue.trim() || !turmaValue.trim()) {
        alert("Por favor, preencha todos os campos.");
        return;
        // Verifica se algum campo está vazio, .trim() remove espaços em branco
    }

    const responsavelUid = auth.currentUser ? auth.currentUser.uid : null;
    if (!responsavelUid) {
        alert("Nenhum usuário logado. Por favor, faça login como responsável.");
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "alunos"), {
            nome: nomeValue,
            dataNascimento: dataNascimentoValue,
            turma: turmaValue,
            responsavelId: responsavelUid, // Associa o aluno ao usuário logado
            criadoEm: new Date() //Mostra a data de criação do aluno
    
        });

        alert("Aluno cadastrado com sucesso! ID: " + docRef.id);
        
        nomeElemento.value = "";
        dataNascimentoElemento.value = "";
        turmaElemento.value = "";
    
    } catch (error) {
        console.error("Erro ao cadastrar aluno, tente novamente." + error.message);
        alert("Erro ao cadastrar aluno, tente novamente." + error.message);
    }
   

}

/**
 * Busca todos os alunos associados a um responsável específico.
 * @param {string} responsavelId 
 * @returns {Promise<Array<Object>>} Uma promessa que resolve com a lista de alunos.
 */
export async function getAlunosDoResponsavel(responsavelId) {
    try {
        const alunosRef = db.collection("alunos");
        
        // A consulta que estávamos construindo:
        const snapshot = await alunosRef.where("responsavelId", "==", responsavelId).get();
        
        const alunos = [];
        snapshot.forEach(doc => {
            alunos.push({
                id: doc.id,
                ...doc.data() // Pega nome, turma, etc.
            });
        });
        return alunos;
        
    } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        return [];
    }
 
}

