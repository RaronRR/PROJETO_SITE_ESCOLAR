// js/user/visualizar_comunicados.js - SISTEMA COMPLETO
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📢 Sistema de visualização de comunicados carregado!");

class VisualizarComunicados {
    constructor() {
        this.usuarioAtual = null;
        this.alunosDoUsuario = [];
        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.usuarioAtual = user;
                console.log("👤 Usuário logado:", user.email);
                
                // Primeiro busca os alunos do usuário
                await this.carregarAlunosDoUsuario();
                
                // Depois carrega os comunicados
                await this.carregarComunicados();
            } else {
                window.location.href = '../login.html';
            }
        });
    }

    async carregarAlunosDoUsuario() {
        try {
            const userEmail = this.usuarioAtual.email;
            console.log("🔍 Buscando alunos para:", userEmail);
            
            const q = query(
                collection(db, "alunos"), 
                where("emailResponsavel", "==", userEmail)
            );
            
            const snapshot = await getDocs(q);
            this.alunosDoUsuario = [];
            
            snapshot.forEach(docSnap => {
                this.alunosDoUsuario.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            
            console.log("✅ Alunos encontrados:", this.alunosDoUsuario.length);
            
        } catch (error) {
            console.error("❌ Erro ao carregar alunos:", error);
        }
    }

    async carregarComunicados() {
        const container = document.getElementById('listaComunicados');
        
        try {
            container.innerHTML = '<p>📡 Carregando comunicados...</p>';

            // Busca comunicados relevantes para o usuário
            const comunicados = await this.buscarComunicadosRelevantes();
            
            if (comunicados.length === 0) {
                this.mostrarSemComunicados();
                return;
            }

            this.mostrarComunicados(comunicados);

        } catch (error) {
            console.error("❌ Erro ao carregar comunicados:", error);
            this.mostrarErro("Erro ao carregar comunicados.");
        }
    }

    async buscarComunicadosRelevantes() {
        const comunicadosRef = collection(db, "comunicados");
        const q = query(comunicadosRef, orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);
        
         console.log("🔍 TOTAL de comunicados no BD:", snapshot.docs.length);

        const comunicadosRelevantes = [];
        const userEmail = this.usuarioAtual.email;

        snapshot.docs.forEach(docSnap => {
        const comunicado = {
            id: docSnap.id,
            ...docSnap.data()
        };
         console.log("📄 Comunicado:", comunicado);
        });


        for (const docSnap of snapshot.docs) {
            const comunicado = {
                id: docSnap.id,
                ...docSnap.data()
            };

            // Verifica se o comunicado é relevante para este usuário
            if (await this.isComunicadoRelevante(comunicado, userEmail)) {
                comunicadosRelevantes.push(comunicado);
            }
        }

        console.log("📨 Comunicados relevantes:", comunicadosRelevantes.length);
        return comunicadosRelevantes;
    }

    async isComunicadoRelevante(comunicado, userEmail) {
        // Se é para todos, é relevante
        if (comunicado.destino === 'todos') {
            return true;
        }

        // Se é para uma turma específica
        if (comunicado.destino === 'turma') {
            return this.alunosDoUsuario.some(aluno => 
                this.getTurmaAluno(aluno) === comunicado.turma
            );
        }

        // Se é para um aluno específico
        if (comunicado.destino === 'aluno') {
            return this.alunosDoUsuario.some(aluno => 
                aluno.id === comunicado.alunoMatricula
            );
        }

        return false;
    }

    getTurmaAluno(aluno) {
        if (aluno.ano && aluno.classe) {
        return `${aluno.ano}${aluno.classe}`.toUpperCase();
    }
    return ''; 
    }

    mostrarComunicados(comunicados) {
        const container = document.getElementById('listaComunicados');
        let html = '';

        comunicados.forEach(comunicado => {
            const dataFormatada = this.formatarData(comunicado.criadoEm);
            const destinoTexto = this.getDestinoTexto(comunicado);
            const isNovo = !comunicado.lidoPor || !comunicado.lidoPor.includes(this.usuarioAtual.uid);

            html += `
                <div class="comunicado-card ${isNovo ? 'novo' : ''}" data-comunicado-id="${comunicado.id}">
                    <div class="comunicado-header">
                        <div>
                            <h3 class="comunicado-titulo">
                                ${comunicado.titulo}
                                ${isNovo ? '<span class="badge-novo">NOVO</span>' : ''}
                            </h3>
                            <div class="comunicado-data">${dataFormatada}</div>
                        </div>
                        <div class="comunicado-destino">${destinoTexto}</div>
                    </div>
                    
                    <div class="comunicado-mensagem">
                        ${comunicado.mensagem}
                    </div>
                    
                    <div style="font-size: 0.8em; color: #6c757d;">
                        💡 Clique para marcar como lido
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Adiciona eventos de clique para marcar como lido
        this.configurarEventosComunicados();
    }

    configurarEventosComunicados() {
        const cards = document.querySelectorAll('.comunicado-card');
        
        cards.forEach(card => {
            card.addEventListener('click', async (e) => {
                const comunicadoId = card.dataset.comunicadoId;
                const isNovo = card.classList.contains('novo');
                
                if (isNovo) {
                    await this.marcarComoLido(comunicadoId);
                    card.classList.remove('novo');
                    
                    // Remove o badge "NOVO"
                    const badge = card.querySelector('.badge-novo');
                    if (badge) {
                        badge.remove();
                    }
                }
            });
        });
    }

    async marcarComoLido(comunicadoId) {
        try {
            const comunicadoRef = doc(db, "comunicados", comunicadoId);
            
            await updateDoc(comunicadoRef, {
                lidoPor: arrayUnion(this.usuarioAtual.uid)
            });
            
            console.log("✅ Comunicado marcado como lido:", comunicadoId);
            
        } catch (error) {
            console.error("❌ Erro ao marcar como lido:", error);
        }
    }

    getDestinoTexto(comunicado) {
        switch(comunicado.destino) {
            case 'todos':
                return '📨 Todos os responsáveis';
            case 'turma':
                return `🏫 Turma ${comunicado.turma}`;
            case 'aluno':
                return `👤 Aluno ${comunicado.alunoMatricula}`;
            default:
                return '📍 Geral';
        }
    }

    formatarData(timestamp) {
        if (!timestamp) return 'Data não disponível';
        
        try {
            const date = timestamp.toDate();
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Data inválida';
        }
    }

    mostrarSemComunicados() {
        const container = document.getElementById('listaComunicados');
        container.innerHTML = `
            <div class="sem-comunicados">
                <div class="icon">📭</div>
                <h3>Nenhum comunicado encontrado</h3>
                <p>Quando a escola enviar comunicados relevantes para você, eles aparecerão aqui.</p>
                <p><small>Você tem ${this.alunosDoUsuario.length} aluno(s) cadastrado(s).</small></p>
            </div>
        `;
    }

    mostrarErro(mensagem) {
        const container = document.getElementById('listaComunicados');
        container.innerHTML = `
            <div class="sem-comunicados" style="color: #dc3545;">
                <div class="icon">❌</div>
                <h3>Erro</h3>
                <p>${mensagem}</p>
            </div>
        `;
    }
}

// Inicializa o sistema
new VisualizarComunicados();