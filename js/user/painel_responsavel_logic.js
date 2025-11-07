import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("🚀 painel_responsavel_logic.js CARREGADO!");

// Verifica se o usuário está logado e carrega os alunos
onAuthStateChanged(auth, async (user) => {
    console.log("🔍 Estado da autenticação:", user ? "Usuário logado" : "Nenhum usuário");
    
    if (user) {
        console.log("📧 Email do usuário logado:", user.email);
        console.log("🆔 UID do usuário:", user.uid);
        await carregarAlunos(user.email);
    } else {
        console.log("❌ Usuário não logado, redirecionando...");
        window.location.href = '../login.html';
    }
});

async function carregarAlunos(emailUsuario) {
    const container = document.getElementById('container-alunos');
    console.log("🎯 Container encontrado:", !!container);
    console.log("🔍 Buscando alunos para o email:", emailUsuario);
    
    if (!container) {
        console.error("❌ ERRO: Elemento #container-alunos não encontrado!");
        return;
    }
    
    container.innerHTML = '<p>🔄 Buscando alunos...</p>';
    
    try {
        // 🔥 TENTA DIFERENTES CAMPOS - DEBUG COMPLETO
        const camposParaTestar = [
            "emailResponsavel", 
            "emailResponseAvel",
            "email_responsavel", 
            "responsavelEmail"
        ];
        
        let alunosEncontrados = [];
        
        for (let campo of camposParaTestar) {
            console.log(`🔍 Tentando campo: ${campo}`);
            
            const q = query(collection(db, "alunos"), where(campo, "==", emailUsuario));
            const snapshot = await getDocs(q);
            
            console.log(`📊 Resultados com ${campo}:`, snapshot.size);
            
            snapshot.forEach(doc => {
                console.log(`✅ Aluno encontrado com ${campo}:`, doc.id, doc.data());
                alunosEncontrados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (snapshot.size > 0) {
                console.log(`🎯 Campo correto encontrado: ${campo}`);
                break;
            }
        }
        
        console.log("🎯 Total de alunos encontrados:", alunosEncontrados.length);
        console.log("📋 Lista completa de alunos:", alunosEncontrados);
        
        if (alunosEncontrados.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>❌ Nenhum aluno encontrado vinculado à sua conta.</p>
                    <small><strong>Email buscado:</strong> ${emailUsuario}</small>
                    <br>
                    <small><strong>Campos testados:</strong> ${camposParaTestar.join(', ')}</small>
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
    const container = document.getElementById('container-alunos');
    
    let html = '';
    
    alunos.forEach(aluno => {
        console.log(" Renderizando aluno:", aluno);
        
         html += `
            <div class="aluno-card" data-aluno-id="${aluno.id}">
                <div class="aluno-nome">${aluno.nomeAluno}</div>
                <div class="aluno-turma">Turma: ${aluno.turma || aluno.classe}</div>
                <div class="aluno-responsavel">Responsável: ${aluno.nomeResponsavel || 'Não informado'}</div>
                
                <div class="aluno-actions">
                    <button class="btn-notas" onclick="verNotas('${aluno.id}')">
                        📊 Ver Notas
                    </button>
                    <button class="btn-comunicados" onclick="verComunicados('${aluno.id}')">
                        📢 Comunicados
                    </button>
                </div>
            </div>
        `;
    });


    container.innerHTML = html;
    console.log("✅ Alunos renderizados com sucesso!");
}

function selecionarAluno(alunoId) {
    console.log("Aluno selecionado:", alunoId);
   
}

window.selecionarAluno = selecionarAluno;

function verNotas(alunoId) {
    console.log("📊 Acessando notas do aluno:", alunoId);
    window.location.href = `visualizar_notas.html?id=${alunoId}`;
}

function verComunicados(alunoId) {
    console.log("📢 Acessando comunicados do aluno:", alunoId);
    
    alert("Sistema de comunicados em desenvolvimento!");
}


window.verNotas = verNotas;
window.verComunicados = verComunicados;