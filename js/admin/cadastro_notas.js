import { db } from '../firebase.js';
import { 
    doc, setDoc, getDoc, collection, getDocs, 
    updateDoc, deleteDoc, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


class NotasAdmin {
    constructor() {
        this.bimestreAtual = "1";
        this.alunosComNotas = [];
        this.modoEdicao = false;
        this.notaEditando = null;
        this.init();
    }

    init() {
        
        const form = document.getElementById("formNotas");

        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.configurarTabs();
            this.configurarEventos();
            this.configurarBotoes();
            
        } else {
            console.error(" Formulário não encontrado!");
        }
    }

    configurarTabs() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const aba = e.target.getAttribute('data-aba');
                this.abrirAba(aba);
            });
        });
    }

    configurarBotoes() {
        const btnBuscar = document.getElementById("btnBuscarAluno");
        const btnCancelar = document.getElementById("btnCancelar");

        if (btnBuscar) {
            btnBuscar.addEventListener("click", () => this.buscarAluno());
        }

        if (btnCancelar) {
            btnCancelar.addEventListener("click", () => this.limparFormulario());
        }
    }

    configurarEventos() {
        
        // Evento do bimestre
        const selectBimestre = document.getElementById('bimestre');
        if (selectBimestre) {
            selectBimestre.addEventListener("change", (e) => {
                this.bimestreAtual = e.target.value;
                
                // Recarrega notas se já tiver aluno selecionado
                const matricula = document.getElementById("alunoId").value.trim();
                if (matricula) {
                    this.carregarNotasExistentes(matricula);
                }
            });
        }

        // Configura cálculo automático de médias
        this.configurarCalculoMedias();

        // Filtros da lista
        const buscarAluno = document.getElementById('buscarAluno');
        const filtroBimestre = document.getElementById('filtroBimestre');
        const filtroTurma = document.getElementById('filtroTurma');
        
        if (buscarAluno) {
            buscarAluno.addEventListener('input', () => this.filtrarNotas());
        }
        if (filtroBimestre) {
            filtroBimestre.addEventListener('change', () => this.filtrarNotas());
        }
        if (filtroTurma) {
            filtroTurma.addEventListener('change', () => this.filtrarNotas());
        }
    }

    configurarCalculoMedias() {
        const materias = ['port', 'mat', 'cie', 'hist', 'geo', 'ing'];
        
        materias.forEach(materia => {
            for (let i = 1; i <= 3; i++) {
                const input = document.getElementById(`${materia}Nota${i}`);
                if (input) {
                    input.addEventListener('input', () => this.calcularMedia(materia));
                }
            }
        });
    }

    abrirAba(aba) {
        
        // Esconde todas as abas
        document.querySelectorAll('.aba-conteudo').forEach(el => {
            el.classList.remove('ativa');
        });
        
        // Remove active de todas as tabs
        document.querySelectorAll('.tab').forEach(el => {
            el.classList.remove('active');
        });
        
        // Mostra a aba selecionada
        const abaElement = document.getElementById('aba-' + aba);
        if (abaElement) {
            abaElement.classList.add('ativa');
        } else {
        }
        
        // Ativa a tab clicada
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-aba') === aba) {
                tab.classList.add('active');
            }
        });

        // Se for a aba gerenciar, carrega as notas
        if (aba === 'gerenciar') {
            this.carregarTodasNotas();
        }
    }

    calcularMedia(materia) {
        const nota1 = parseFloat(document.getElementById(`${materia}Nota1`).value) || 0;
        const nota2 = parseFloat(document.getElementById(`${materia}Nota2`).value) || 0;
        const nota3 = parseFloat(document.getElementById(`${materia}Nota3`).value) || 0;
        
        const media = ((nota1 + nota2 + nota3) / 3).toFixed(1);
        const mediaElement = document.getElementById(`${materia}Media`);
        
        if (mediaElement) {
            mediaElement.textContent = media;
            
            // Adiciona classe baseada na média
            mediaElement.className = 'media-valor';
            if (media >= 6) {
                mediaElement.classList.add('media-aprovado');
            } else if (media >= 4) {
                mediaElement.classList.add('media-recuperacao');
            } else {
                mediaElement.classList.add('media-reprovado');
            }
        }
    }

    async buscarAluno() {
        const matricula = document.getElementById("alunoId").value.trim();
        const infoAluno = document.getElementById("infoAluno");
        
        if (!matricula) {
            alert("❌ Digite a matrícula do aluno!");
            return;
        }

        try {
            infoAluno.innerHTML = '<p>🔍 Buscando aluno...</p>';
            infoAluno.style.display = 'block';
            
            const alunoRef = doc(db, "alunos", matricula);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                infoAluno.innerHTML = '<p style="color: #dc3545;">❌ Aluno não encontrado!</p>';
                return;
            }

            const alunoData = alunoSnap.data();
            infoAluno.innerHTML = `
                <div>
                    <p><strong>✅ Aluno encontrado:</strong></p>
                    <p><strong>Nome:</strong> ${alunoData.nomeAluno}</p>
                    <p><strong>Turma:</strong> ${alunoData.ano}° ${alunoData.classe}</p>
                    <p><strong>Responsável:</strong> ${alunoData.emailResponsavel}</p>
                </div>
            `;

            // Carrega notas existentes
            await this.carregarNotasExistentes(matricula);

        } catch (error) {
            console.error("Erro ao buscar aluno:", error);
            infoAluno.innerHTML = '<p style="color: #dc3545;">❌ Erro ao buscar aluno</p>';
        }
    }

    async carregarNotasExistentes(matricula) {
        try {
            const notasRef = collection(db, "alunos", matricula, "notas");
            const snapshot = await getDocs(notasRef);
            
            // Limpa todos os campos primeiro
            this.limparCamposNotas();
            
            if (snapshot.empty) {
                console.log("Nenhuma nota encontrada para este aluno");
                return;
            }

            snapshot.forEach(docSnap => {
                const [materia, bimestre] = docSnap.id.split('_');
                
                // Só carrega se for o bimestre atual
                if (bimestre === this.bimestreAtual) {
                    const notas = docSnap.data();
                    
                    // Preenche os campos com as notas existentes
                    for (let i = 1; i <= 3; i++) {
                        const input = document.getElementById(`${materia}Nota${i}`);
                        if (input && notas[`nota${i}`]) {
                            input.value = notas[`nota${i}`];
                        }
                    }
                    
                    // Recalcula a média
                    this.calcularMedia(materia);
                }
            });


        } catch (error) {
            console.error("Erro ao carregar notas existentes:", error);
        }
    }

    limparCamposNotas() {
        const materias = ['port', 'mat', 'cie', 'hist', 'geo', 'ing'];
        
        materias.forEach(materia => {
            for (let i = 1; i <= 3; i++) {
                const input = document.getElementById(`${materia}Nota${i}`);
                if (input) input.value = '';
            }
            const mediaElement = document.getElementById(`${materia}Media`);
            if (mediaElement) {
                mediaElement.textContent = '0.0';
                mediaElement.className = 'media-valor';
            }
        });
    }

    getNotasMateria(prefixo) {
        return {
            nota1: this.parseNota(`${prefixo}Nota1`),
            nota2: this.parseNota(`${prefixo}Nota2`),
            nota3: this.parseNota(`${prefixo}Nota3`)
        };
    }

    parseNota(id) {
        const valor = document.getElementById(id).value;
        return valor ? parseFloat(valor) : 0;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const matricula = document.getElementById("alunoId").value.trim();
        const bimestre = document.getElementById("bimestre").value;
        
        if (!matricula) {
            alert("❌ Informe a matrícula do aluno!");
            return;
        }

        if (!bimestre) {
            alert("❌ Selecione o bimestre!");
            return;
        }

        try {
            // Verifica se aluno existe
            const alunoRef = doc(db, "alunos", matricula);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                alert("❌ Aluno não encontrado! Verifique a matrícula.");
                return;
            }

            const alunoData = alunoSnap.data();

            // Coleta todas as notas
            const notas = {
                portugues: this.getNotasMateria("port"),
                matematica: this.getNotasMateria("mat"),
                ciencias: this.getNotasMateria("cie"),
                historia: this.getNotasMateria("hist"),
                geografia: this.getNotasMateria("geo"),
                ingles: this.getNotasMateria("ing")
            };


            // Salva cada matéria com o bimestre no ID
            for (const [materia, dadosNotas] of Object.entries(notas)) {
                const media = ((dadosNotas.nota1 + dadosNotas.nota2 + dadosNotas.nota3) / 3).toFixed(2);
                const docId = `${materia}_${bimestre}`;
                
                await setDoc(
                    doc(db, "alunos", matricula, "notas", docId),
                    { 
                        ...dadosNotas, 
                        materia: materia,
                        bimestre: bimestre,
                        media: parseFloat(media),
                        alunoId: matricula,
                        alunoNome: alunoData.nomeAluno,
                        turma: `${alunoData.ano}° ${alunoData.classe}`,
                        atualizadoEm: new Date()
                    },
                    { merge: true }
                );

            }

            alert(`Todas as notas do ${bimestre}° bimestre foram salvas com sucesso!`);
            this.mostrarResumoNotas(notas, bimestre);

            // Limpa o formulário e recarrega a lista
            this.limparFormulario();
            if (document.getElementById('aba-gerenciar').classList.contains('ativa')) {
                this.carregarTodasNotas();
            }

        } catch (error) {
            console.error("❌ Erro ao salvar notas:", error);
            alert("❌ Erro ao salvar notas: " + error.message);
        }
    }

    mostrarResumoNotas(notas, bimestre) {
        let resumo = `📊 Resumo das Notas - ${bimestre}° Bimestre:\n\n`;
        
        for (const [materia, dados] of Object.entries(notas)) {
            const media = ((dados.nota1 + dados.nota2 + dados.nota3) / 3).toFixed(1);
            const status = media >= 6 ? "✅ Aprovado" : media >= 4 ? "⚠️ Recuperação" : "❌ Reprovado";
            
            resumo += `${this.formatarMateria(materia)}: ${dados.nota1} | ${dados.nota2} | ${dados.nota3} → Média: ${media} - ${status}\n`;
        }
    }

    async carregarTodasNotas() {
        try {
            const lista = document.getElementById('listaNotas');
            
            if (!lista) {
                console.error("Elemento listaNotas não encontrado!");
                return;
            }

            lista.innerHTML = '<p>🔍 Buscando alunos com notas...</p>';

            // Primeiro, busca todos os alunos
            const alunosRef = collection(db, "alunos");
            const alunosSnapshot = await getDocs(alunosRef);
            
            this.alunosComNotas = [];

            for (const alunoDoc of alunosSnapshot.docs) {
                const alunoData = alunoDoc.data();
                const matricula = alunoDoc.id;
                
                // Busca notas do aluno
                const notasRef = collection(db, "alunos", matricula, "notas");
                const notasSnapshot = await getDocs(notasRef);
                
                if (!notasSnapshot.empty) {
                    const notasAluno = {
                        matricula: matricula,
                        nome: alunoData.nomeAluno,
                        turma: `${alunoData.ano}° ${alunoData.classe}`,
                        notas: []
                    };

                    notasSnapshot.forEach(notaDoc => {
                        notasAluno.notas.push({
                            id: notaDoc.id,
                            ...notaDoc.data()
                        });
                    });

                    this.alunosComNotas.push(notasAluno);
                }
            }

            this.mostrarListaNotas();

        } catch (error) {
            console.error("❌ Erro ao carregar notas:", error);
            const lista = document.getElementById('listaNotas');
            if (lista) {
                lista.innerHTML = '<p>Erro ao carregar notas. Verifique o console.</p>';
            }
        }
    }

    mostrarListaNotas(alunosFiltrados = null) {
        const lista = document.getElementById('listaNotas');
        if (!lista) return;

        const alunos = alunosFiltrados || this.alunosComNotas;

        if (alunos.length === 0) {
            lista.innerHTML = '<p>Nenhuma nota encontrada.</p>';
            return;
        }

        let html = '';
        alunos.forEach(aluno => {
            // Agrupa notas por bimestre
            const notasPorBimestre = this.agruparNotasPorBimestre(aluno.notas);

            html += `
                <div class="aluno-item">
                    <div class="aluno-header">
                        <div>
                            <div style="font-weight: bold; font-size: 1.2em;">${aluno.nome}</div>
                            <div class="aluno-info">
                                📝 Matrícula: ${aluno.matricula} | 🏫 Turma: ${aluno.turma}
                            </div>
                        </div>
                        <div class="aluno-acoes">
                            <button class="btn btn-primary" data-matricula="${aluno.matricula}" data-action="editar">
                                ✏️ Editar
                            </button>
                        </div>
                    </div>
                    
                    <div class="materias-grid">
                        ${this.renderizarNotasPorBimestre(notasPorBimestre)}
                    </div>
                </div>
            `;
        });

        lista.innerHTML = html;
        this.configurarBotoesEdicao();
    }

    agruparNotasPorBimestre(notas) {
        const bimestres = {};
        
        notas.forEach(nota => {
            const bimestre = nota.bimestre;
            if (!bimestres[bimestre]) {
                bimestres[bimestre] = [];
            }
            bimestres[bimestre].push(nota);
        });

        return bimestres;
    }

    renderizarNotasPorBimestre(notasPorBimestre) {
        let html = '';
        
        for (const [bimestre, notas] of Object.entries(notasPorBimestre)) {
            html += `
                <div class="materia-card">
                    <div class="materia-nome">
                        ${bimestre}° Bimestre 
                        <span class="bimestre-badge">${notas.length} matérias</span>
                    </div>
                    ${notas.map(nota => `
                        <div class="nota-item">
                            <span>${this.formatarMateria(nota.materia)}:</span>
                            <span>
                                ${nota.nota1} | ${nota.nota2} | ${nota.nota3} 
                                → <strong>${nota.media}</strong>
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return html;
    }

    configurarBotoesEdicao() {
        const botoesEditar = document.querySelectorAll('[data-action="editar"]');
        
        botoesEditar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const matricula = e.target.getAttribute('data-matricula');
                this.editarNotasAluno(matricula);
            });
        });
    }

    editarNotasAluno(matricula) {
        
        // Preenche a matrícula no formulário
        document.getElementById('alunoId').value = matricula;
        
        // Busca automaticamente o aluno
        this.buscarAluno();
        
        // Vai para a aba de lançamento
        this.abrirAba('lancar');
    }

    filtrarNotas() {
        const busca = document.getElementById('buscarAluno')?.value.toLowerCase() || '';
        const filtroBimestre = document.getElementById('filtroBimestre')?.value || 'all';
        const filtroTurma = document.getElementById('filtroTurma')?.value || 'all';

        let alunosFiltrados = this.alunosComNotas.filter(aluno => {
            const matchBusca = aluno.nome.toLowerCase().includes(busca) ||
                             aluno.matricula.includes(busca) ||
                             aluno.turma.toLowerCase().includes(busca);
            
            const matchTurma = filtroTurma === 'all' || aluno.turma.includes(filtroTurma);
            
            // Filtro por bimestre
            let matchBimestre = true;
            if (filtroBimestre !== 'all') {
                matchBimestre = aluno.notas.some(nota => nota.bimestre === filtroBimestre);
            }

            return matchBusca && matchTurma && matchBimestre;
        });

        this.mostrarListaNotas(alunosFiltrados);
    }

    limparFormulario() {
        document.getElementById('formNotas').reset();
        document.getElementById('infoAluno').style.display = 'none';
        document.getElementById('infoAluno').innerHTML = '';
        this.limparCamposNotas();
        this.sairModoEdicao();
    }

    sairModoEdicao() {
        this.modoEdicao = false;
        this.notaEditando = null;

        document.querySelector('button[type="submit"]').textContent = '💾 Salvar Notas';
        document.getElementById('btnCancelar').style.display = 'none';
        document.getElementById('notaId').value = '';
    }

    formatarMateria(materia) {
        const materias = {
            'portugues': 'Português',
            'matematica': 'Matemática',
            'ciencias': 'Ciências',
            'historia': 'História',
            'geografia': 'Geografia',
            'ingles': 'Inglês'
        };
        return materias[materia] || materia;
    }
}

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.notasAdmin = new NotasAdmin();
});