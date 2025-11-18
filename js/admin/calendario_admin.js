import { db } from '../firebase.js';
import { 
    collection, addDoc, updateDoc, deleteDoc, doc, 
    getDocs, serverTimestamp, query, orderBy 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


class CalendarioAdmin {
    constructor() {
        this.eventos = [];
        this.modoEdicao = false;
        this.eventoEditando = null;
        this.init();
    }

    init() {
        
        const form = document.getElementById("formEvento");

        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.configurarTabs();
            this.configurarEventosFormulario();
            this.configurarBotoes();
            
            // Carrega eventos iniciais
            this.carregarEventos();
            
        } else {
            console.error("❌ Formulário não encontrado!");
        }
    }

    configurarTabs() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const aba = e.target.getAttribute('onclick').replace("abrirAba('", "").replace("')", "");
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
        
        // Mostra/oculta filtros baseado no destino
        const destino = document.getElementById('destino');
        if (destino) {
            destino.addEventListener('change', (e) => this.mostrarFiltros(e.target.value));
        }

        // Preview em tempo real
        ['titulo', 'tipo', 'data', 'descricao'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('input', () => this.atualizarPreview());
            }
        });

        // Filtros da lista
        const buscarEvento = document.getElementById('buscarEvento');
        const filtroTipoLista = document.getElementById('filtroTipoLista');
        
        if (buscarEvento) {
            buscarEvento.addEventListener('input', () => this.filtrarEventos());
        }
        if (filtroTipoLista) {
            filtroTipoLista.addEventListener('change', () => this.filtrarEventos());
        }
    }

    abrirAba(aba) {
        
        // Esconde todas as abas
        document.querySelectorAll('.aba-conteudo').forEach(el => {
            el.style.display = 'none';
        });
        
        // Remove active de todas as tabs
        document.querySelectorAll('.tab').forEach(el => {
            el.classList.remove('active');
        });
        
        // Mostra a aba selecionada
        const abaElement = document.getElementById('aba-' + aba);
        if (abaElement) {
            abaElement.style.display = 'block';
        } else {
            console.error("❌ Aba não encontrada:", 'aba-' + aba);
        }
        
        // Ativa a tab clicada
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('onclick') === `abrirAba('${aba}')`) {
                tab.classList.add('active');
            }
        });

        // Se for a aba gerenciar, recarrega os eventos
        if (aba === 'gerenciar') {
            this.mostrarListaEventos();
        }
    }

    async carregarEventos() {
        try {

            const eventosRef = collection(db, "eventosCalendario");
            const q = query(eventosRef, orderBy("dataTimestamp", "desc"));
            const snapshot = await getDocs(q);

            this.eventos = [];
            snapshot.forEach(docSnap => {
                this.eventos.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            this.mostrarListaEventos();

        } catch (error) {
            console.error("❌ Erro ao carregar eventos:", error);
            const lista = document.getElementById('listaEventos');
            if (lista) {
                lista.innerHTML = '<p>Erro ao carregar eventos. Verifique o console.</p>';
            }
        }
    }

    mostrarListaEventos(eventosFiltrados = null) {
        const lista = document.getElementById('listaEventos');
        if (!lista) {
            console.error("❌ Elemento listaEventos não encontrado!");
            return;
        }

        const eventos = eventosFiltrados || this.eventos;

        if (eventos.length === 0) {
            lista.innerHTML = '<p>Nenhum evento cadastrado.</p>';
            return;
        }

        let html = '';
        eventos.forEach(evento => {
            const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');

            html += `
                <div class="evento-item ${evento.tipo}">
                    <div class="evento-header">
                        <div class="evento-titulo">${this.getEventIcon(evento.tipo)} ${evento.titulo}</div>
                        <div class="evento-acoes">
                            <button class="btn btn-warning" onclick="calendarioAdmin.editarEvento('${evento.id}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-danger" onclick="calendarioAdmin.excluirEvento('${evento.id}')">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                    <div class="evento-data">📅 ${dataFormatada} | 🎯 ${this.formatarTipo(evento.tipo)} | 👥 ${this.formatarDestino(evento)}</div>
                    <div class="evento-desc">${evento.descricao || 'Sem descrição'}</div>
                </div>
            `;
        });

        lista.innerHTML = html;
    }

    filtrarEventos() {
        const busca = document.getElementById('buscarEvento')?.value.toLowerCase() || '';
        const filtroTipo = document.getElementById('filtroTipoLista')?.value || 'all';

        let eventosFiltrados = this.eventos.filter(evento => {
            const matchBusca = evento.titulo.toLowerCase().includes(busca) ||
                (evento.descricao && evento.descricao.toLowerCase().includes(busca));
            const matchTipo = filtroTipo === 'all' || evento.tipo === filtroTipo;

            return matchBusca && matchTipo;
        });

        this.mostrarListaEventos(eventosFiltrados);
    }

    async handleSubmit(e) {
        e.preventDefault();

        const titulo = document.getElementById('titulo').value.trim();
        const tipo = document.getElementById('tipo').value;
        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value.trim();
        const destino = document.getElementById('destino').value;

        // Validações
        if (!titulo || !tipo || !data || !destino) {
            alert("❌ Preencha todos os campos obrigatórios!");
            return;
        }

        try {
            const eventoData = {
                titulo: titulo,
                tipo: tipo,
                data: data,
                dataTimestamp: new Date(data + 'T00:00:00'),
                descricao: descricao,
                destino: destino,
                atualizadoEm: serverTimestamp()
            };

            // Adiciona filtros específicos
            if (destino === 'turma') {
                eventoData.turma = document.getElementById('turmaSelect').value;
            } else if (destino === 'ano') {
                eventoData.ano = document.getElementById('anoSelect').value;
            }

            if (this.modoEdicao && this.eventoEditando) {
                // Modo edição
                await updateDoc(doc(db, "eventosCalendario", this.eventoEditando.id), eventoData);
                alert("✅ Evento atualizado com sucesso!");
            } else {
                // Modo cadastro
                eventoData.criadoEm = serverTimestamp();
                const docRef = await addDoc(collection(db, "eventosCalendario"), eventoData);
                alert("🎉 Evento criado com sucesso!");
            }

            // Recarrega a lista e limpa o formulário
            await this.carregarEventos();
            this.limparFormulario();
            this.sairModoEdicao();

        } catch (error) {
            console.error("❌ Erro ao salvar evento:", error);
            alert("❌ Erro ao salvar evento: " + error.message);
        }
    }

    editarEvento(eventoId) {
        const evento = this.eventos.find(e => e.id === eventoId);
        if (!evento) {
            alert("❌ Evento não encontrado!");
            return;
        }

        this.modoEdicao = true;
        this.eventoEditando = evento;

        // Preenche o formulário
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('titulo').value = evento.titulo;
        document.getElementById('tipo').value = evento.tipo;
        document.getElementById('data').value = evento.data;
        document.getElementById('descricao').value = evento.descricao || '';
        document.getElementById('destino').value = evento.destino;

        // Mostra filtros se necessário
        this.mostrarFiltros(evento.destino);
        if (evento.destino === 'turma') {
            document.getElementById('turmaSelect').value = evento.turma;
        } else if (evento.destino === 'ano') {
            document.getElementById('anoSelect').value = evento.ano;
        }

        // Atualiza UI
        document.querySelector('button[type="submit"]').textContent = '💾 Atualizar Evento';
        document.getElementById('btnCancelar').style.display = 'inline-block';
        document.getElementById('eventoPreview').style.display = 'none';

        // Vai para aba de cadastro
        this.abrirAba('cadastrar');

    }

    async excluirEvento(eventoId) {
        if (!confirm("❌ Tem certeza que deseja excluir este evento?")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "eventosCalendario", eventoId));
            alert("✅ Evento excluído com sucesso!");

            // Recarrega a lista
            await this.carregarEventos();

        } catch (error) {
            console.error("❌ Erro ao excluir evento:", error);
            alert("❌ Erro ao excluir evento: " + error.message);
        }
    }

    sairModoEdicao() {
        this.modoEdicao = false;
        this.eventoEditando = null;

        document.querySelector('button[type="submit"]').textContent = '💾 Salvar Evento';
        document.getElementById('btnCancelar').style.display = 'none';
        document.getElementById('eventoId').value = '';
    }

    limparFormulario() {
        document.getElementById('formEvento').reset();
        document.getElementById('eventoPreview').style.display = 'none';
        document.getElementById('filtroTurma').style.display = 'none';
        document.getElementById('filtroAno').style.display = 'none';
        this.sairModoEdicao();
    }

    mostrarFiltros(destino) {
        const filtroTurma = document.getElementById('filtroTurma');
        const filtroAno = document.getElementById('filtroAno');

        if (filtroTurma) filtroTurma.style.display = 'none';
        if (filtroAno) filtroAno.style.display = 'none';

        if (destino === 'turma' && filtroTurma) {
            filtroTurma.style.display = 'block';
        } else if (destino === 'ano' && filtroAno) {
            filtroAno.style.display = 'block';
        }

        this.atualizarPreview();
    }

    atualizarPreview() {
        const titulo = document.getElementById('titulo').value;
        const tipo = document.getElementById('tipo').value;
        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value;
        const destino = document.getElementById('destino').value;

        const preview = document.getElementById('eventoPreview');
        const previewContent = document.getElementById('previewContent');

        if (!preview || !previewContent) return;

        if (!titulo && !data) {
            preview.style.display = 'none';
            return;
        }

        let destinoTexto = '';
        switch (destino) {
            case 'todos': 
                destinoTexto = '👥 Para todos os responsáveis'; 
                break;
            case 'turma':
                const turma = document.getElementById('turmaSelect').value;
                destinoTexto = `🏫 Turma: ${turma || 'Não selecionada'}`;
                break;
            case 'ano':
                const ano = document.getElementById('anoSelect').value;
                destinoTexto = `📚 Ano: ${ano || 'Não selecionado'}`;
                break;
        }

        const tipoInfo = this.getTipoInfo(tipo);

        previewContent.innerHTML = `
            <div style="border-left: 4px solid ${tipoInfo.color}; padding-left: 10px;">
                <p><strong>${tipoInfo.icon} ${titulo || 'Sem título'}</strong></p>
                <p>📅 <strong>Data:</strong> ${data ? new Date(data).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                <p>${descricao || 'Sem descrição'}</p>
                <hr>
                <small>${destinoTexto}</small>
            </div>
        `;

        preview.style.display = 'block';
    }

    getTipoInfo(tipo) {
        const tipos = {
            'reuniao': { icon: '📋', color: '#007bff' },
            'feriado': { icon: '🎉', color: '#28a745' },
            'prova': { icon: '📝', color: '#dc3545' },
            'evento': { icon: '🎊', color: '#ffc107' },
            'importante': { icon: '⚠️', color: '#fd7e14' }
        };
        return tipos[tipo] || { icon: '📅', color: '#6c757d' };
    }

    getEventIcon(tipo) {
        const icons = {
            'reuniao': '📋',
            'feriado': '🎉',
            'prova': '📝',
            'evento': '🎊',
            'importante': '⚠️'
        };
        return icons[tipo] || '📅';
    }

    formatarTipo(tipo) {
        const tipos = {
            'reuniao': 'Reunião',
            'feriado': 'Feriado',
            'prova': 'Prova',
            'evento': 'Evento Escolar',
            'importante': 'Aviso Importante'
        };
        return tipos[tipo] || tipo;
    }

    formatarDestino(evento) {
        switch (evento.destino) {
            case 'todos': 
                return 'Todos os responsáveis';
            case 'turma': 
                return `Turma ${evento.turma}`;
            case 'ano': 
                return `${evento.ano}° Ano`;
            default: 
                return 'Geral';
        }
    }
}

// Funções globais para o HTML
function abrirAba(aba) {
    if (window.calendarioAdmin) {
        window.calendarioAdmin.abrirAba(aba);
    }
}

function limparFormulario() {
    if (window.calendarioAdmin) {
        window.calendarioAdmin.limparFormulario();
    }
}

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.calendarioAdmin = new CalendarioAdmin();
});