import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// Verifica se o usuário está logado e carrega os alunos
onAuthStateChanged(auth, async (user) => {
    
    if (user) {
        console.log("📧 Email do usuário logado:", user.email);
        await carregarAlunos(user.email);
    } else {
        console.log("❌ Usuário não logado, redirecionando...");
        window.location.href = '../login.html';
    }
});

async function carregarAlunos(emailUsuario) {
    const container = document.getElementById('container-alunos');
    
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
            
            const q = query(collection(db, "alunos"), where(campo, "==", emailUsuario));
            const snapshot = await getDocs(q);
            
            
            snapshot.forEach(doc => {
                alunosEncontrados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (snapshot.size > 0) {
                break;
            }
        }
        
        
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
    
    if (alunos.length === 0) {
        container.innerHTML = `
            <div class="sem-alunos">
                <div style="font-size: 3em; margin-bottom: 15px;">👤</div>
                <h3>Nenhum aluno encontrado</h3>
                <p>Nenhum aluno está vinculado à sua conta.</p>
                <p><small>Entre em contato com a administração da escola.</small></p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="container-alunos">';
    
    alunos.forEach(aluno => {
        
        html += `
            <div class="aluno-card" data-aluno-id="${aluno.id}">
                <div class="aluno-nome">${aluno.nomeAluno || 'Nome não informado'}</div>
                <div class="aluno-turma">🏫 Turma: ${aluno.turma || aluno.ano + '° ' + aluno.classe || 'Não informada'}</div>
                <div class="aluno-responsavel">📧 Responsável: ${aluno.emailResponsavel || 'Não informado'}</div>
                
                <div class="aluno-actions">
                    <button class="btn-notas" onclick="verNotas('${aluno.id}')">
                        📊 Ver Notas
                    </button>
                    <button class="btn-comunicados" onclick="verComunicados('${aluno.id}')">
                        📢 Comunicados
                    </button>
                    <button class="btn-calendario" onclick="verCalendario()">
                        🗓️ Calendário
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
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
    
    window.location.href = `visualizar_comunicado.html?alunoId=${alunoId}`;
}

function verCalendario() {
    console.log("🗓️ Acessando calendário escolar");
    window.location.href = "visualizar_calendario.html";
}

window.verCalendario = verCalendario;
window.verNotas = verNotas;
window.verComunicados = verComunicados;