import { db } from '../firebase.js';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, 
    getDocs, serverTimestamp, query, orderBy, getDoc 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📢 Sistema de comunicados carregado!");

class ComunicadosAdmin {
    constructor() {
        this.comunicados = [];
        this.modoEdicao = false;
        this.comunicadoEditando = null;
        this.init();
    }

    init() {
        console.log("🔄 Inicializando sistema de comunicados...");
        
        const form = document.getElementById("formComunicado");

        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.configurarTabs();
            this.configurarEventosFormulario();
            this.configurarBotoes();
            
            // Carrega comunicados iniciais
            this.carregarComunicados();
            
            console.log("✅ Sistema de comunicados inicializado");
        } else {
            console.error("❌ Formulário não encontrado!");
        }
    }

    configurarTabs() {
        console.log("🔧 Configurando tabs...");
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const aba = e.target.getAttribute('data-aba');
                console.log("📌 Tab clicada:", aba);
                this.abrirAba(aba);
            });
        });
    }

    configurarBotoes() {
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.limparFormulario());
        }
    }

    configurarEventosFormulario() {
        console.log("🔧 Configurando eventos do formulário...");
        
        // Mostra/oculta filtros baseado no destino
        const destino = document.getElementById('destino');
        if (destino) {
            destino.addEventListener('change', (e) => this.mostrarFiltros(e.target.value));
        }

        // Preview em tempo real e contador de caracteres
        const mensagem = document.getElementById('mensagem');
        if (mensagem) {
            mensagem.addEventListener('input', () => {
                this.atualizarContadorCaracteres();
                this.atualizarPreview();
            });
        }

        document.getElementById('titulo').addEventListener('input', () => this.atualizarPreview());

        // Busca aluno quando digita matrícula
        const alunoSelect = document.getElementById('alunoSelect');
        if (alunoSelect) {
            alunoSelect.addEventListener('input', (e) => {
                this.buscarAluno(e.target.value);
            });
        }

        // Filtros da lista
        const buscarComunicado = document.getElementById('buscarComunicado');
        const filtroDestinoLista = document.getElementById('filtroDestinoLista');
        
        if (buscarComunicado) {
            buscarComunicado.addEventListener('input', () => this.filtrarComunicados());
        }
        if (filtroDestinoLista) {
            filtroDestinoLista.addEventListener('change', () => this.filtrarComunicados());
        }
    }

    abrirAba(aba) {
        console.log("🔍 Tentando abrir aba:", aba);
        
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
            console.log("✅ Aba mostrada:", aba);
        } else {
            console.error("❌ Aba não encontrada:", 'aba-' + aba);
        }
        
        // Ativa a tab clicada
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-aba') === aba) {
                tab.classList.add('active');
                console.log("✅ Tab ativada:", aba);
            }
        });

        // Se for a aba gerenciar, recarrega os comunicados
        if (aba === 'gerenciar') {
            console.log("🔄 Recarregando comunicados para aba gerenciar");
            this.mostrarListaComunicados();
        }
    }

    async carregarComunicados() {
        try {
            console.log("📥 Carregando comunicados do Firebase...");

            const comunicadosRef = collection(db, "comunicados");
            const q = query(comunicadosRef, orderBy("criadoEm", "desc"));
            const snapshot = await getDocs(q);

            this.comunicados = [];
            snapshot.forEach(docSnap => {
                this.comunicados.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            console.log("✅ Comunicados carregados:", this.comunicados.length);
            this.mostrarListaComunicados();

        } catch (error) {
            console.error("❌ Erro ao carregar comunicados:", error);
            const lista = document.getElementById('listaComunicados');
            if (lista) {
                lista.innerHTML = '<p>Erro ao carregar comunicados. Verifique o console.</p>';
            }
        }
    }

    mostrarListaComunicados(comunicadosFiltrados = null) {
        const lista = document.getElementById('listaComunicados');
        if (!lista) {
            console.error("❌ Elemento listaComunicados não encontrado!");
            return;
        }

        const comunicados = comunicadosFiltrados || this.comunicados;
        console.log("📋 Mostrando lista com", comunicados.length, "comunicados");

        if (comunicados.length === 0) {
            lista.innerHTML = '<p>Nenhum comunicado encontrado.</p>';
            return;
        }

        let html = '';
        comunicados.forEach(comunicado => {
            const dataFormatada = comunicado.criadoEm ? 
                new Date(comunicado.criadoEm.toDate()).toLocaleString('pt-BR') : 'Data não disponível';

            html += `
                <div class="comunicado-item ${comunicado.destino}">
                    <div class="comunicado-header">
                        <div class="comunicado-titulo">${this.getDestinoIcon(comunicado.destino)} ${comunicado.titulo}</div>
                        <div class="comunicado-acoes">
                            <button class="btn btn-warning" data-id="${comunicado.id}" data-action="editar">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger" data-id="${comunicado.id}" data-action="excluir">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                    <div class="comunicado-info">
                        📅 ${dataFormatada} | 🎯 ${this.formatarDestino(comunicado)}
                        ${comunicado.lidoPor ? ` | 👁️ ${comunicado.lidoPor.length} visualizações` : ''}
                    </div>
                    <div class="comunicado-mensagem">${comunicado.mensagem}</div>
                </div>
            `;
        });

        lista.innerHTML = html;

        // Adiciona event listeners aos botões
        this.configurarBotoesComunicados();
        console.log("✅ Lista de comunicados exibida");
    }

    configurarBotoesComunicados() {
        const botoesEditar = document.querySelectorAll('[data-action="editar"]');
        const botoesExcluir = document.querySelectorAll('[data-action="excluir"]');

        botoesEditar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const comunicadoId = e.target.getAttribute('data-id');
                this.editarComunicado(comunicadoId);
            });
        });

        botoesExcluir.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const comunicadoId = e.target.getAttribute('data-id');
                this.excluirComunicado(comunicadoId);
            });
        });
    }

    filtrarComunicados() {
        const busca = document.getElementById('buscarComunicado')?.value.toLowerCase() || '';
        const filtroDestino = document.getElementById('filtroDestinoLista')?.value || 'all';

        let comunicadosFiltrados = this.comunicados.filter(comunicado => {
            const matchBusca = comunicado.titulo.toLowerCase().includes(busca) ||
                comunicado.mensagem.toLowerCase().includes(busca);
            const matchDestino = filtroDestino === 'all' || comunicado.destino === filtroDestino;

            return matchBusca && matchDestino;
        });

        this.mostrarListaComunicados(comunicadosFiltrados);
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log("📤 Enviando comunicado...");

        const titulo = document.getElementById('titulo').value.trim();
        const mensagem = document.getElementById('mensagem').value.trim();
        const destino = document.getElementById('destino').value;

        // Validações
        if (!titulo || !mensagem || !destino) {
            alert("❌ Preencha todos os campos obrigatórios!");
            return;
        }

        if (mensagem.length > 500) {
            alert("❌ A mensagem deve ter no máximo 500 caracteres!");
            return;
        }

        try {
            // Prepara dados do comunicado
            const comunicadoData = {
                titulo: titulo,
                mensagem: mensagem,
                destino: destino,
                atualizadoEm: serverTimestamp(),
                lidoPor: []
            };

            // Adiciona filtros específicos
            if (destino === 'turma') {
                const turma = document.getElementById('turmaSelect').value;
                if (!turma) {
                    alert("❌ Selecione uma turma!");
                    return;
                }
                comunicadoData.turma = turma;
            } else if (destino === 'aluno') {
                const alunoMatricula = document.getElementById('alunoSelect').value;
                if (!alunoMatricula) {
                    alert("❌ Informe a matrícula do aluno!");
                    return;
                }
                comunicadoData.alunoMatricula = alunoMatricula;
                
                // Verifica se aluno existe
                const alunoRef = doc(db, "alunos", alunoMatricula);
                const alunoSnap = await getDoc(alunoRef);
                if (!alunoSnap.exists()) {
                    alert("❌ Aluno não encontrado! Verifique a matrícula.");
                    return;
                }
            }

            if (this.modoEdicao && this.comunicadoEditando) {
                // Modo edição
                await updateDoc(doc(db, "comunicados", this.comunicadoEditando.id), comunicadoData);
                console.log("✅ Comunicado atualizado:", this.comunicadoEditando.id);
                alert("✅ Comunicado atualizado com sucesso!");
            } else {
                // Modo cadastro
                comunicadoData.criadoEm = serverTimestamp();
                const docRef = await addDoc(collection(db, "comunicados"), comunicadoData);
                console.log("✅ Comunicado criado com ID:", docRef.id);
                
                // Feedback de sucesso
                this.mostrarSucesso(comunicadoData);
            }

            // Recarrega a lista e limpa o formulário
            await this.carregarComunicados();
            this.limparFormulario();
            this.sairModoEdicao();

        } catch (error) {
            console.error("❌ Erro ao salvar comunicado:", error);
            alert("❌ Erro ao salvar comunicado: " + error.message);
        }
    }

    editarComunicado(comunicadoId) {
        console.log("✏️ Editando comunicado:", comunicadoId);
        const comunicado = this.comunicados.find(c => c.id === comunicadoId);
        if (!comunicado) {
            alert("❌ Comunicado não encontrado!");
            return;
        }

        this.modoEdicao = true;
        this.comunicadoEditando = comunicado;

        // Preenche o formulário
        document.getElementById('comunicadoId').value = comunicado.id;
        document.getElementById('titulo').value = comunicado.titulo;
        document.getElementById('mensagem').value = comunicado.mensagem;
        document.getElementById('destino').value = comunicado.destino;

        // Mostra filtros se necessário
        this.mostrarFiltros(comunicado.destino);
        if (comunicado.destino === 'turma') {
            document.getElementById('turmaSelect').value = comunicado.turma;
        } else if (comunicado.destino === 'aluno') {
            document.getElementById('alunoSelect').value = comunicado.alunoMatricula;
            this.buscarAluno(comunicado.alunoMatricula);
        }

        // Atualiza UI
        document.querySelector('button[type="submit"]').textContent = '💾 Atualizar Comunicado';
        document.getElementById('btnCancelar').style.display = 'inline-block';
        document.getElementById('comunicadoPreview').style.display = 'none';

        // Vai para aba de envio
        this.abrirAba('enviar');

        console.log("✅ Formulário preenchido para edição");
    }

    async excluirComunicado(comunicadoId) {
        if (!confirm("❌ Tem certeza que deseja excluir este comunicado?")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "comunicados", comunicadoId));
            console.log("🗑️ Comunicado excluído:", comunicadoId);
            alert("✅ Comunicado excluído com sucesso!");

            // Recarrega a lista
            await this.carregarComunicados();

        } catch (error) {
            console.error("❌ Erro ao excluir comunicado:", error);
            alert("❌ Erro ao excluir comunicado: " + error.message);
        }
    }

    sairModoEdicao() {
        this.modoEdicao = false;
        this.comunicadoEditando = null;

        document.querySelector('button[type="submit"]').textContent = '💾 Salvar Comunicado';
        document.getElementById('btnCancelar').style.display = 'none';
        document.getElementById('comunicadoId').value = '';
    }

    limparFormulario() {
        document.getElementById('formComunicado').reset();
        document.getElementById('comunicadoPreview').style.display = 'none';
        document.getElementById('filtroTurma').style.display = 'none';
        document.getElementById('filtroAluno').style.display = 'none';
        document.getElementById('infoAluno').innerHTML = '';
        this.atualizarContadorCaracteres();
        this.sairModoEdicao();
        console.log("✅ Formulário limpo");
    }

    // MÉTODOS EXISTENTES (mantidos da versão anterior)
    mostrarFiltros(destino) {
        const filtroTurma = document.getElementById('filtroTurma');
        const filtroAluno = document.getElementById('filtroAluno');

        if (filtroTurma) filtroTurma.style.display = 'none';
        if (filtroAluno) filtroAluno.style.display = 'none';

        if (destino === 'turma' && filtroTurma) {
            filtroTurma.style.display = 'block';
        } else if (destino === 'aluno' && filtroAluno) {
            filtroAluno.style.display = 'block';
        }

        this.atualizarPreview();
    }

    async buscarAluno(matricula) {
        const infoAluno = document.getElementById('infoAluno');
        
        if (!matricula) {
            infoAluno.innerHTML = '';
            return;
        }

        try {
            infoAluno.innerHTML = '<span style="color: #6c757d;">🔍 Buscando aluno...</span>';
            
            const alunoRef = doc(db, "alunos", matricula);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                infoAluno.innerHTML = '<span style="color: #dc3545;">❌ Aluno não encontrado</span>';
                return;
            }

            const alunoData = alunoSnap.data();
            infoAluno.innerHTML = `
                <span style="color: #28a745;">
                    ✅ ${alunoData.nomeAluno} - ${alunoData.ano}° ${alunoData.classe}
                </span>
            `;

        } catch (error) {
            console.error("Erro ao buscar aluno:", error);
            infoAluno.innerHTML = '<span style="color: #dc3545;">❌ Erro na busca</span>';
        }
    }

    atualizarContadorCaracteres() {
        const mensagem = document.getElementById('mensagem');
        const contador = document.getElementById('contadorCaracteres');
        
        if (mensagem && contador) {
            const caracteres = mensagem.value.length;
            contador.textContent = `${caracteres}/500 caracteres`;
            
            if (caracteres > 450) {
                contador.style.color = '#dc3545';
            } else if (caracteres > 400) {
                contador.style.color = '#ffc107';
            } else {
                contador.style.color = '#6c757d';
            }
        }
    }

    atualizarPreview() {
        const titulo = document.getElementById('titulo').value;
        const mensagem = document.getElementById('mensagem').value;
        const destino = document.getElementById('destino').value;
        const preview = document.getElementById('comunicadoPreview');
        const previewContent = document.getElementById('previewContent');

        if (!preview || !previewContent) return;

        if (!titulo && !mensagem) {
            preview.style.display = 'none';
            return;
        }

        let destinoTexto = '';
        switch(destino) {
            case 'todos':
                destinoTexto = '📨 <strong>Para todos os responsáveis</strong>';
                break;
            case 'turma':
                const turma = document.getElementById('turmaSelect').value;
                destinoTexto = `🏫 <strong>Turma:</strong> ${turma || 'Não selecionada'}`;
                break;
            case 'aluno':
                const alunoMatricula = document.getElementById('alunoSelect').value;
                destinoTexto = `👤 <strong>Aluno:</strong> ${alunoMatricula || 'Não selecionado'}`;
                break;
            default:
                destinoTexto = '📍 <strong>Destino não selecionado</strong>';
        }

        previewContent.innerHTML = `
            <p><strong>${titulo || 'Sem título'}</strong></p>
            <p>${mensagem || 'Sem mensagem'}</p>
            <hr>
            <small>${destinoTexto}</small>
        `;
        
        preview.style.display = 'block';
    }

    mostrarSucesso(comunicadoData) {
        let destinatarios = '';
        
        switch(comunicadoData.destino) {
            case 'todos':
                destinatarios = 'todos os responsáveis';
                break;
            case 'turma':
                destinatarios = `turma ${comunicadoData.turma}`;
                break;
            case 'aluno':
                destinatarios = `aluno ${comunicadoData.alunoMatricula}`;
                break;
        }

        const mensagem = `
🎉 Comunicado enviado com sucesso!

📋 Título: ${comunicadoData.titulo}
📨 Para: ${destinatarios}
⏰ Enviado em: ${new Date().toLocaleString()}

Os responsáveis receberão este comunicado em seus painéis.
        `.trim();

        alert(mensagem);
    }

    getDestinoIcon(destino) {
        const icons = {
            'todos': '📨',
            'turma': '🏫', 
            'aluno': '👤'
        };
        return icons[destino] || '📢';
    }

    formatarDestino(comunicado) {
        switch (comunicado.destino) {
            case 'todos': 
                return 'Todos os responsáveis';
            case 'turma': 
                return `Turma ${comunicado.turma}`;
            case 'aluno': 
                return `Aluno ${comunicado.alunoMatricula}`;
            default: 
                return 'Destino não especificado';
        }
    }
}

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.comunicadosAdmin = new ComunicadosAdmin();
});