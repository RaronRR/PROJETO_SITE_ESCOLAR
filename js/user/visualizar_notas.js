// js/user/visualizar_notas.js - SISTEMA CORRIGIDO
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📊 Sistema de visualização de notas carregado!");

class VisualizarNotas {
    constructor() {
        this.alunoId = null;
        this.bimestreAtual = "1"; // Bimestre padrão
        this.init();
    }

    init() {
        // Pega o ID do aluno da URL
        this.getAlunoIdFromURL();
        
        // Configura os botões de bimestre
        this.configurarBimestres();
        
        // Verifica autenticação e carrega dados
        onAuthStateChanged(auth, (user) => {
            if (user && this.alunoId) {
                this.carregarDadosAluno();
                this.carregarNotas();
            } else if (!user) {
                window.location.href = '../login.html';
            } else {
                this.mostrarErro("Aluno não especificado.");
            }
        });
    }

    getAlunoIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.alunoId = urlParams.get('id');
        console.log("🎯 ID do aluno:", this.alunoId);
    }

    configurarBimestres() {
        const botoes = document.querySelectorAll('.bimestre-btn');
        botoes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove classe active de todos
                botoes.forEach(b => b.classList.remove('active'));
                // Adiciona classe active no clicado
                e.target.classList.add('active');
                
                this.bimestreAtual = e.target.dataset.bimestre;
                console.log(`🔄 Carregando notas do ${this.bimestreAtual}° bimestre`);
                this.carregarNotas();
            });
        });
    }

    async carregarDadosAluno() {
        try {
            const alunoRef = doc(db, "alunos", this.alunoId);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                this.mostrarErro("Aluno não encontrado.");
                return;
            }

            const alunoData = alunoSnap.data();
            this.mostrarInfoAluno(alunoData);

        } catch (error) {
            console.error("Erro ao carregar dados do aluno:", error);
            this.mostrarErro("Erro ao carregar dados do aluno.");
        }
    }

    mostrarInfoAluno(alunoData) {
        const infoContainer = document.getElementById('infoAluno');
        
        infoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">👤 Aluno</span>
                <span class="info-value">${alunoData.nomeAluno || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">🎯 Matrícula</span>
                <span class="info-value">${this.alunoId}</span>
            </div>
            <div class="info-item">
                <span class="info-label">🏫 Turma</span>
                <span class="info-value">${alunoData.ano || ''}° ${alunoData.classe || ''}</span>
            </div>
            <div class="info-item">
                <span class="info-label">📅 Ano Letivo</span>
                <span class="info-value">2024</span>
            </div>
        `;
    }

    async carregarNotas() {
        const container = document.getElementById('boletimContainer');
        
        try {
            container.innerHTML = '<div class="loading"><p>📚 Carregando notas...</p></div>';

            console.log(`🔍 Buscando notas do aluno ${this.alunoId} para o ${this.bimestreAtual}° bimestre`);

            // ✅ CORREÇÃO: Busca TODAS as notas e filtra por bimestre
            const notasRef = collection(db, "alunos", this.alunoId, "notas");
            const snapshot = await getDocs(notasRef);

            if (snapshot.empty) {
                this.mostrarSemNotas();
                return;
            }

            const notasDoBimestre = [];
            
            // DEBUG: Mostra todos os documentos encontrados
            console.log("📁 Todos os documentos na subcoleção notas:");
            snapshot.forEach(docSnap => {
                const notaData = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                console.log("   📄", docSnap.id, "=>", notaData);
                
                // ✅ FILTRA APENAS AS NOTAS DO BIMESTRE ATUAL
                if (notaData.bimestre === this.bimestreAtual) {
                    console.log("   ✅ Incluindo - bimestre correto");
                    notasDoBimestre.push(notaData);
                } else {
                    console.log("   ❌ Ignorando - bimestre diferente");
                }
            });

            console.log(`📊 Notas do ${this.bimestreAtual}° bimestre:`, notasDoBimestre.length);

            if (notasDoBimestre.length === 0) {
                this.mostrarSemNotas();
                return;
            }

            this.mostrarNotas(notasDoBimestre);

        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            this.mostrarErro("Erro ao carregar notas.");
        }
    }

    mostrarNotas(notas) {
        const container = document.getElementById('boletimContainer');
        let html = '';
        let somaMedias = 0;
        let totalMaterias = 0;

        // Ordena as matérias alfabeticamente
        notas.sort((a, b) => a.materia.localeCompare(b.materia));

        notas.forEach(nota => {
            const media = nota.media || 0;
            const statusClasse = this.getClassByMedia(media);
            const statusTexto = this.getStatusByMedia(media);

            somaMedias += media;
            totalMaterias++;

            html += `
                <div class="materia-card">
                    <div class="materia-header">
                        <div class="materia-nome">${this.formatarNomeMateria(nota.materia)}</div>
                        <div class="materia-media ${statusClasse}">
                            ${media.toFixed(1)}
                        </div>
                    </div>
                    
                    <div class="notas-grid">
                        <div class="nota-item">
                            <div class="nota-label">Nota 1</div>
                            <div class="nota-value">${nota.nota1 || 0}</div>
                        </div>
                        <div class="nota-item">
                            <div class="nota-label">Nota 2</div>
                            <div class="nota-value">${nota.nota2 || 0}</div>
                        </div>
                        <div class="nota-item">
                            <div class="nota-label">Nota 3</div>
                            <div class="nota-value">${nota.nota3 || 0}</div>
                        </div>
                        <div class="nota-item">
                            <div class="nota-label">Média</div>
                            <div class="nota-value ${statusClasse}">${media.toFixed(1)}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px; font-size: 0.9em; color: #6c757d;">
                        Status: <strong>${statusTexto}</strong>
                    </div>
                </div>
            `;
        });

        // Adiciona resumo geral
        if (totalMaterias > 0) {
            const mediaGeral = somaMedias / totalMaterias;
            const statusGeralClasse = this.getClassByMedia(mediaGeral);
            const statusGeralTexto = this.getStatusByMedia(mediaGeral);

            html += `
                <div class="status-geral">
                    <div class="status-titulo">Média Geral</div>
                    <div class="status-media-geral">${mediaGeral.toFixed(1)}</div>
                    <div class="status-situacao">${statusGeralTexto}</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    formatarNomeMateria(materia) {
        const nomes = {
            'portugues': '📝 Português',
            'matematica': '🔢 Matemática', 
            'ciencias': '🔬 Ciências',
            'historia': '📜 História',
            'geografia': '🌎 Geografia',
            'ingles': '🔠 Inglês'
        };
        
        return nomes[materia] || materia;
    }

    getClassByMedia(media) {
        if (media >= 7) return 'media-aprovada';
        if (media >= 5) return 'media-recuperacao';
        return 'media-reprovada';
    }

    getStatusByMedia(media) {
        if (media >= 7) return '✅ Aprovado';
        if (media >= 5) return '⚠️ Recuperação';
        return '❌ Reprovado';
    }

    mostrarSemNotas() {
        const container = document.getElementById('boletimContainer');
        container.innerHTML = `
            <div class="sem-notas">
                <div class="icon">📭</div>
                <h3>Nenhuma nota lançada</h3>
                <p>As notas do ${this.bimestreAtual}° bimestre ainda não foram cadastradas.</p>
            </div>
        `;
    }

    mostrarErro(mensagem) {
        const container = document.getElementById('boletimContainer');
        container.innerHTML = `
            <div class="sem-notas" style="color: #dc3545;">
                <div class="icon">❌</div>
                <h3>Erro</h3>
                <p>${mensagem}</p>
            </div>
        `;
    }
}

// Inicializa o sistema
new VisualizarNotas();