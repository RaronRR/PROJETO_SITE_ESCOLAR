import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


class VisualizarCalendario {
    constructor() {
        this.usuarioAtual = null;
        this.alunosDoUsuario = [];
        this.eventos = [];
        this.currentDate = new Date();
        this.filterType = 'all';
        this.viewMode = 'calendar';
        this.init();
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.usuarioAtual = user;
                console.log("👤 Usuário logado:", user.email);
                
                await this.carregarAlunosDoUsuario();
                await this.carregarEventos();
                this.configurarEventos();
                this.renderizarCalendario();
            } else {
                window.location.href = '../login.html';
            }
        });
    }

    async carregarAlunosDoUsuario() {
        try {
            const userEmail = this.usuarioAtual.email;
            
            const q = query(
                collection(db, "alunos"), 
                where("emailResponsavel", "==", userEmail)
            );
            
            const snapshot = await getDocs(q);
            this.alunosDoUsuario = [];
            
            snapshot.forEach(docSnap => {
                const aluno = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                this.alunosDoUsuario.push(aluno);
            });
            
            
        } catch (error) {
            console.error("❌ Erro ao carregar alunos:", error);
        }
    }

    async carregarEventos() {
        try {
            
            const eventosRef = collection(db, "eventosCalendario");
            const q = query(eventosRef, orderBy("dataTimestamp", "asc"));
            const snapshot = await getDocs(q);
            
            this.eventos = [];
            const userEmail = this.usuarioAtual.email;

            snapshot.forEach(docSnap => {
                const evento = {
                    id: docSnap.id,
                    ...docSnap.data()
                };
                
                // Verifica se o evento é relevante para este usuário
                if (this.isEventoRelevante(evento)) {
                    this.eventos.push(evento);
                }
            });


        } catch (error) {
            console.error("❌ Erro ao carregar eventos:", error);
        }
    }

    isEventoRelevante(evento) {
        // Se é para todos, é relevante
        if (evento.destino === 'todos') {
            return true;
        }

        // Se é para uma turma específica
        if (evento.destino === 'turma') {
            return this.alunosDoUsuario.some(aluno => 
                this.getTurmaAluno(aluno) === evento.turma
            );
        }

        // Se é para um ano específico
        if (evento.destino === 'ano') {
            return this.alunosDoUsuario.some(aluno => 
                aluno.ano === evento.ano
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

    configurarEventos() {
        // Navegação do mês
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderizarCalendario();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderizarCalendario();
        });

        // Filtros
        document.getElementById('filterType').addEventListener('change', (e) => {
            this.filterType = e.target.value;
            this.renderizarCalendario();
            this.renderizarListaEventos();
        });

        document.getElementById('filterView').addEventListener('change', (e) => {
            this.viewMode = e.target.value;
            this.mudarVisualizacao();
        });
    }

    mudarVisualizacao() {
        const calendarView = document.getElementById('calendarView');
        const listView = document.getElementById('listView');

        if (this.viewMode === 'calendar') {
            calendarView.style.display = 'block';
            listView.style.display = 'none';
            this.renderizarCalendario();
        } else {
            calendarView.style.display = 'none';
            listView.style.display = 'block';
            this.renderizarListaEventos();
        }
    }

    renderizarCalendario() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthElement = document.getElementById('currentMonth');
        
        // Atualiza o mês atual
        const options = { month: 'long', year: 'numeric' };
        currentMonthElement.textContent = this.currentDate.toLocaleDateString('pt-BR', options);
        
        // Limpa o grid (mantém apenas os headers)
        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        // Primeiro dia do mês
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        // Último dia do mês
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // Dia da semana do primeiro dia (0 = Domingo, 6 = Sábado)
        const firstDayIndex = firstDay.getDay();
        
        // Dias do mês anterior (para preencher o início)
        const prevMonthLastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
        
        // Adiciona dias do mês anterior
        for (let i = firstDayIndex; i > 0; i--) {
            const dayElement = this.criarDiaElement(prevMonthLastDay - i + 1, true);
            calendarGrid.appendChild(dayElement);
        }
        
        // Adiciona dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = this.criarDiaElement(i, false);
            calendarGrid.appendChild(dayElement);
        }
        
        // Calcula quantos dias faltam para completar a grid (42 células no total)
        const totalCells = 42;
        const remainingCells = totalCells - (firstDayIndex + lastDay.getDate());
        
        // Adiciona dias do próximo mês
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = this.criarDiaElement(i, true);
            calendarGrid.appendChild(dayElement);
        }
    }

    criarDiaElement(dayNumber, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Verifica se é hoje
        const today = new Date();
        const currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), dayNumber);
        
        if (!isOtherMonth && 
            currentDate.getDate() === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${dayNumber}</div>
            <div class="day-events" id="events-${this.currentDate.getFullYear()}-${this.currentDate.getMonth()}-${dayNumber}"></div>
        `;
        
        // Adiciona eventos para este dia
        if (!isOtherMonth) {
            this.adicionarEventosAoDia(dayElement, currentDate);
        }
        
        return dayElement;
    }

    adicionarEventosAoDia(dayElement, date) {
        const eventsContainer = dayElement.querySelector('.day-events');
        const dateString = date.toISOString().split('T')[0];
        
        const eventosDoDia = this.eventos.filter(evento => {
            if (this.filterType !== 'all' && evento.tipo !== this.filterType) {
                return false;
            }
            return evento.data === dateString;
        });
        
        eventosDoDia.forEach(evento => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item ${evento.tipo}`;
            eventElement.textContent = this.getEventIcon(evento.tipo) + ' ' + evento.titulo;
            eventElement.title = evento.descricao || evento.titulo;
            
            eventElement.addEventListener('click', () => {
                this.mostrarDetalhesEvento(evento);
            });
            
            eventsContainer.appendChild(eventElement);
        });
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

    renderizarListaEventos() {
        const eventsList = document.getElementById('eventsList');
        
        let eventosFiltrados = this.eventos;
        
        if (this.filterType !== 'all') {
            eventosFiltrados = this.eventos.filter(evento => evento.tipo === this.filterType);
        }
        
        // Ordena por data
        eventosFiltrados.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        if (eventosFiltrados.length === 0) {
            eventsList.innerHTML = '<p>Nenhum evento encontrado.</p>';
            return;
        }
        
        let html = '';
        
        eventosFiltrados.forEach(evento => {
            const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
            const hoje = new Date();
            const dataEvento = new Date(evento.data);
            const diffTime = dataEvento - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let diasTexto = '';
            if (diffDays === 0) {
                diasTexto = '<span style="color: #dc3545;">(Hoje)</span>';
            } else if (diffDays === 1) {
                diasTexto = '<span style="color: #fd7e14;">(Amanhã)</span>';
            } else if (diffDays > 0) {
                diasTexto = `<span style="color: #28a745;">(Em ${diffDays} dias)</span>`;
            } else {
                diasTexto = '<span style="color: #6c757d;">(Passado)</span>';
            }
            
            html += `
                <div class="event-card ${evento.tipo}" onclick="calendar.mostrarDetalhesEvento(${JSON.stringify(evento).replace(/"/g, '&quot;')})">
                    <div class="event-date">
                        ${dataFormatada} ${diasTexto}
                    </div>
                    <div class="event-title">
                        ${this.getEventIcon(evento.tipo)} ${evento.titulo}
                    </div>
                    <div class="event-desc">
                        ${evento.descricao || 'Sem descrição'}
                    </div>
                </div>
            `;
        });
        
        eventsList.innerHTML = html;
    }

    mostrarDetalhesEvento(evento) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        const dataFormatada = new Date(evento.data).toLocaleDateString('pt-BR');
        const tipoFormatado = this.formatarTipo(evento.tipo);
        
        modalTitle.textContent = evento.titulo;
        modalContent.innerHTML = `
            <p><strong>📅 Data:</strong> ${dataFormatada}</p>
            <p><strong>🎯 Tipo:</strong> ${tipoFormatado}</p>
            <p><strong>📝 Descrição:</strong> ${evento.descricao || 'Sem descrição'}</p>
            <p><strong>👥 Destino:</strong> ${this.formatarDestino(evento)}</p>
        `;
        
        modal.style.display = 'flex';
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
        switch(evento.destino) {
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

// Inicializa o sistema
const calendar = new VisualizarCalendario();

// Torna acessível globalmente para os event listeners
window.calendar = calendar;