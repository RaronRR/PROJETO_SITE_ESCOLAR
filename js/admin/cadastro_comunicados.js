// js/admin/cadastro_comunicados.js
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📢 Sistema de comunicados carregado!");

class CadastroComunicados {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById("formComunicado");
        
        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.configurarEventos();
            console.log("✅ Formulário de comunicados inicializado");
        }
    }

    configurarEventos() {
        // Mostra/oculta filtros baseado no destino
        document.getElementById('destino').addEventListener('change', (e) => {
            this.mostrarFiltros(e.target.value);
        });

        // Preview em tempo real
        document.getElementById('titulo').addEventListener('input', () => this.atualizarPreview());
        document.getElementById('mensagem').addEventListener('input', () => this.atualizarPreview());

        // Busca aluno quando digita matrícula
        document.getElementById('alunoSelect').addEventListener('input', (e) => {
            this.buscarAluno(e.target.value);
        });
    }

    mostrarFiltros(destino) {
        const filtroTurma = document.getElementById('filtroTurma');
        const filtroAluno = document.getElementById('filtroAluno');

        // Oculta todos primeiro
        filtroTurma.style.display = 'none';
        filtroAluno.style.display = 'none';

        // Mostra o filtro correto
        if (destino === 'turma') {
            filtroTurma.style.display = 'block';
        } else if (destino === 'aluno') {
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

    atualizarPreview() {
        const titulo = document.getElementById('titulo').value;
        const mensagem = document.getElementById('mensagem').value;
        const destino = document.getElementById('destino').value;
        const preview = document.getElementById('comunicadoPreview');
        const previewContent = document.getElementById('previewContent');

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

    async handleSubmit(e) {
        e.preventDefault();
        console.log("📤 Enviando comunicado...");

        const titulo = document.getElementById('titulo').value.trim();
        const mensagem = document.getElementById('mensagem').value.trim();
        const destino = document.getElementById('destino').value;

        // Validações
        if (!titulo || !mensagem || !destino) {
            alert("Preencha todos os campos obrigatórios!");
            return;
        }

        if (mensagem.length > 500) {
            alert("A mensagem deve ter no máximo 500 caracteres!");
            return;
        }

        try {
            // Prepara dados do comunicado
            const comunicadoData = {
                titulo: titulo,
                mensagem: mensagem,
                destino: destino,
                criadoEm: serverTimestamp(),
                lidoPor: []
            };

            // Adiciona filtros específicos
            if (destino === 'turma') {
                const turma = document.getElementById('turmaSelect').value;
                if (!turma) {
                    alert("Selecione uma turma!");
                    return;
                }
                comunicadoData.turma = turma;
            } else if (destino === 'aluno') {
                const alunoMatricula = document.getElementById('alunoSelect').value;
                if (!alunoMatricula) {
                    alert("Informe a matrícula do aluno!");
                    return;
                }
                comunicadoData.alunoMatricula = alunoMatricula;
                
                // Verifica se aluno existe
                const alunoRef = doc(db, "alunos", alunoMatricula);
                const alunoSnap = await getDoc(alunoRef);
                if (!alunoSnap.exists()) {
                    alert("Aluno não encontrado! Verifique a matrícula.");
                    return;
                }
            }

            // Salva no Firestore
            await addDoc(collection(db, "comunicados"), comunicadoData);
            
            console.log("✅ Comunicado salvo:", comunicadoData);
            
            // Feedback de sucesso
            this.mostrarSucesso(comunicadoData);
            
            // Limpa formulário
            this.limparFormulario();

        } catch (error) {
            console.error("❌ Erro ao enviar comunicado:", error);
            alert("Erro ao enviar comunicado: " + error.message);
        }
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

    limparFormulario() {
        document.getElementById('formComunicado').reset();
        document.getElementById('comunicadoPreview').style.display = 'none';
        document.getElementById('filtroTurma').style.display = 'none';
        document.getElementById('filtroAluno').style.display = 'none';
        document.getElementById('infoAluno').innerHTML = '';
    }
}

// Inicializa o sistema
new CadastroComunicados();