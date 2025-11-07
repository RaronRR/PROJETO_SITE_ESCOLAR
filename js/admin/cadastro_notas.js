// js/admin/cadastro_notas.js - SISTEMA COMPLETO
import { db } from '../firebase.js';
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📊 Sistema de notas carregado!");

class CadastroNotas {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById("formNotas");
        const btnBuscar = document.getElementById("btnBuscarAluno");
        
        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            console.log("✅ Formulário de notas inicializado");
        }

        if (btnBuscar) {
            btnBuscar.addEventListener("click", () => this.buscarAluno());
        }

        // Adiciona listeners para calcular médias em tempo real
        this.configurarCalculoMedias();
    }

    configurarCalculoMedias() {
        // Configura cálculo automático de médias
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

    calcularMedia(materia) {
        const nota1 = parseFloat(document.getElementById(`${materia}Nota1`).value) || 0;
        const nota2 = parseFloat(document.getElementById(`${materia}Nota2`).value) || 0;
        const nota3 = parseFloat(document.getElementById(`${materia}Nota3`).value) || 0;
        
        const media = ((nota1 + nota2 + nota3) / 3).toFixed(1);
        document.getElementById(`${materia}Media`).textContent = media;
    }

    async buscarAluno() {
        const matricula = document.getElementById("alunoId").value.trim();
        const infoAluno = document.getElementById("infoAluno");
        
        if (!matricula) {
            alert("Digite a matrícula do aluno!");
            return;
        }

        try {
            infoAluno.innerHTML = '<p>🔍 Buscando aluno...</p>';
            
            const alunoRef = doc(db, "alunos", matricula);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                infoAluno.innerHTML = '<p style="color: red;">❌ Aluno não encontrado!</p>';
                return;
            }

            const alunoData = alunoSnap.data();
            infoAluno.innerHTML = `
                <div style="background: #f0f8ff; padding: 10px; border-radius: 5px;">
                    <p><strong>✅ Aluno encontrado:</strong></p>
                    <p><strong>Nome:</strong> ${alunoData.nomeAluno}</p>
                    <p><strong>Turma:</strong> ${alunoData.ano}° ${alunoData.classe}</p>
                    <p><strong>Responsável:</strong> ${alunoData.emailResponsavel}</p>
                </div>
            `;

            // Carrega notas existentes se houver
            await this.carregarNotasExistentes(matricula);

        } catch (error) {
            console.error("Erro ao buscar aluno:", error);
            infoAluno.innerHTML = '<p style="color: red;">❌ Erro ao buscar aluno</p>';
        }
    }

    async carregarNotasExistentes(matricula) {
        try {
            const notasRef = collection(db, "alunos", matricula, "notas");
            const snapshot = await getDocs(notasRef);
            
            if (snapshot.empty) {
                console.log("Nenhuma nota encontrada para este aluno");
                return;
            }

            snapshot.forEach(docSnap => {
                const materia = docSnap.id;
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
            });

            console.log("✅ Notas existentes carregadas");

        } catch (error) {
            console.error("Erro ao carregar notas existentes:", error);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const matricula = document.getElementById("alunoId").value.trim();
        if (!matricula) {
            alert("Informe a matrícula do aluno!");
            return;
        }

        try {
            // Verifica se aluno existe
            const alunoRef = doc(db, "alunos", matricula);
            const alunoSnap = await getDoc(alunoRef);

            if (!alunoSnap.exists()) {
                alert("Aluno não encontrado! Verifique a matrícula.");
                return;
            }

            // Coleta todas as notas
            const notas = {
                portugues: this.getNotasMateria("port"),
                matematica: this.getNotasMateria("mat"),
                ciencias: this.getNotasMateria("cie"),
                historia: this.getNotasMateria("hist"),
                geografia: this.getNotasMateria("geo"),
                ingles: this.getNotasMateria("ing")
            };

            console.log("💾 Salvando notas:", notas);

            // Salva cada matéria
            for (const [materia, dadosNotas] of Object.entries(notas)) {
                const media = ((dadosNotas.nota1 + dadosNotas.nota2 + dadosNotas.nota3) / 3).toFixed(2);
                
                await setDoc(
                    doc(db, "alunos", matricula, "notas", materia),
                    { 
                        ...dadosNotas, 
                        media: parseFloat(media),
                        atualizadoEm: new Date(),
                        bimestre: "1° Bimestre" // Pode ser dinâmico depois
                    },
                    { merge: true }
                );

                console.log(`✅ ${materia} salva - Média: ${media}`);
            }

            alert("🎉 Todas as notas foram salvas com sucesso!");
            this.mostrarResumoNotas(notas);

        } catch (error) {
            console.error("❌ Erro ao salvar notas:", error);
            alert("Erro ao salvar notas: " + error.message);
        }
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

    mostrarResumoNotas(notas) {
        let resumo = "📊 Resumo das Notas Salvas:\n\n";
        
        for (const [materia, dados] of Object.entries(notas)) {
            const media = ((dados.nota1 + dados.nota2 + dados.nota3) / 3).toFixed(1);
            const status = media >= 6 ? "✅ Aprovado" : "❌ Recuperação";
            
            resumo += `${materia}: ${dados.nota1} | ${dados.nota2} | ${dados.nota3} → Média: ${media} - ${status}\n`;
        }
        
        console.log(resumo);
    }
}

// Inicializa o sistema de notas
new CadastroNotas();