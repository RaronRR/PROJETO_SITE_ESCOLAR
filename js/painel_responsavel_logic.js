// painel_responsavel_logic.js - VERSÃO FINAL CORRIGIDA
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("🚀 Script painel_responsavel_logic.js carregado!");

function getContainer() {
    const container = document.getElementById('container-alunos');
    if (!container) {
        console.error('❌ ERRO CRÍTICO: Elemento #container-alunos não encontrado!');
        // Cria o elemento se não existir
        const newContainer = document.createElement('div');
        newContainer.id = 'container-alunos';
        document.body.appendChild(newContainer);
        return newContainer;
    }
    return container;
}

// 🔥 CORREÇÃO DO EMAIL - função para normalizar email
function normalizarEmail(email) {
    return email.toLowerCase().trim();
}

// Verifica autenticação
onAuthStateChanged(auth, async (user) => {
    console.log("🔍 Estado da autenticação:", user ? "Usuário logado" : "Nenhum usuário");
    
    if (user) {
        const emailNormalizado = normalizarEmail(user.email);
        console.log("📧 Email normalizado:", emailNormalizado);
        console.log("🆔 UID do usuário:", user.uid);
        
        await carregarAlunos(emailNormalizado);
    } else {
        console.log("❌ Usuário não logado, redirecionando...");
        window.location.href = '../login.html';
    }
});

async function carregarAlunos(emailUsuario) {
    const container = getContainer();
    container.innerHTML = '<p>Buscando alunos...</p>';
    
    console.log("🎯 Buscando alunos para:", emailUsuario);
    
    try {
        // 🔥 TENTA DIFERENTES CAMPOS - o Firestore mostra "emailResponseAvel"
        const camposParaTestar = [
            "emailResponseAvel", 
            "emailResponsavel",
            "email_responsavel", 
            "responsavelEmail"
        ];
        
        let alunosEncontrados = [];
        
        for (let campo of camposParaTestar) {
            console.log(`🔍 Tentando campo: ${campo}`);
            
            const q = query(collection(db, "alunos"), where(campo, "==", emailUsuario));
            const snapshot = await getDocs(q);
            
            console.log(`📊 Resultados com ${campo}:`, snapshot.size);
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    alunosEncontrados.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                break; // Para no primeiro campo que encontrar resultados
            }
        }
        
        console.log("🎯 Total de alunos encontrados:", alunosEncontrados.length);
        console.log("📋 Lista de alunos:", alunosEncontrados);
        
        if (alunosEncontrados.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>Nenhum aluno encontrado vinculado à sua conta.</p>
                    <small><strong>Email buscado:</strong> ${emailUsuario}</small>
                    <br>
                    <small>Verifique se o email está correto ou entre em contato com a administração.</small>
                </div>
            `;
            return;
        }

        // Renderiza os alunos encontrados
        renderizarAlunos(alunosEncontrados);
        
    } catch (error) {
        console.error("❌ Erro ao carregar alunos:", error);
        container.innerHTML = `
            <div style="color: red; padding: 20px;">
                <p>Erro ao carregar alunos:</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function renderizarAlunos(alunos) {
    const container = getContainer();
    
    let html = '';
    
    alunos.forEach(aluno => {
        console.log("🎨 Renderizando aluno:", aluno);
        
        html += `
            <div class="aluno-card" data-aluno-id="${aluno.id}">
                <div class="aluno-nome">${aluno.nomeAluno}</div>
                <div class="aluno-turma">Turma: ${aluno.turma}</div>
                <div class="aluno-responsavel">Responsável: ${aluno.nomeResponsavel || 'Não informado'}</div>
                <button class="btn-selecionar" onclick="selecionarAluno('${aluno.id}')">
                    Selecionar Aluno
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log("✅ Alunos renderizados com sucesso!");
}

// 🔥 FUNÇÃO GLOBAL para selecionar aluno
function selecionarAluno(alunoId) {
    console.log("🎯 Aluno selecionado:", alunoId);
    alert(`Aluno ${alunoId} selecionado!`);
    // Aqui você pode redirecionar: window.location.href = `detalhes.html?id=${alunoId}`;
}

// Torna a função global
window.selecionarAluno = selecionarAluno;

// 🔥 TESTE INICIAL
console.log("📌 Container no carregamento:", document.getElementById('container-alunos'));