import { db } from '../firebase.js';
import { doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

console.log("📊 Sistema de notas carregado!");

class CadastroNotas {
    constructor() {
        this.bimestreAtual = "1"; // Bimestre padrão
        this.init();
    }

    init() {
        const form = document.getElementById("formNotas");
        const btnBuscar = document.getElementById("btnBuscarAluno");
        const selectBimestre = document.getElementById("bimestre");
        
        if (form) {
            form.addEventListener("submit", (e) => this.handleSubmit(e));
            console.log("✅ Formulário de notas inicializado");
        }

        if (btnBuscar) {
            btnBuscar.addEventListener("click", () => this.buscarAluno());
        }

        if (selectBimestre) {
            selectBimestre.addEventListener("change", (e) => {
                this.bimestreAtual = e.target.value;
                console.log("📅 Bimestre selecionado:", this.bimestreAtual);
                // Recarrega notas se já tiver aluno selecionado
                const matricula = document.getElementById("alunoId").value.trim();
                if (matricula) {
                    this.carregarNotasExistentes(matricula);
                }
            });
        }

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

            console.log("✅ Notas existentes carregadas para o", this.bimestreAtual + "° bimestre");

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
            document.getElementById(`${materia}Media`).textContent = '0.0';
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
            alert("Informe a matrícula do aluno!");
            return;
        }

        if (!bimestre) {
            alert("Selecione o bimestre!");
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

             // DEBUG: Verifica notas existentes
            console.log("🔍 Verificando notas existentes...");
            const notasRef = collection(db, "alunos", matricula, "notas");
            const snapshot = await getDocs(notasRef);
            
            console.log("📁 Documentos existentes na subcoleção notas:");
            snapshot.forEach(docSnap => {
                console.log("   📄", docSnap.id, "=>", docSnap.data());
            });


            // Coleta todas as notas
            const notas = {
                portugues: this.getNotasMateria("port"),
                matematica: this.getNotasMateria("mat"),
                ciencias: this.getNotasMateria("cie"),
                historia: this.getNotasMateria("hist"),
                geografia: this.getNotasMateria("geo"),
                ingles: this.getNotasMateria("ing")
            };

            console.log("💾 Salvando notas para o", bimestre + "° bimestre:", notas);

            // Salva cada matéria com o bimestre no ID
            for (const [materia, dadosNotas] of Object.entries(notas)) {
                const media = ((dadosNotas.nota1 + dadosNotas.nota2 + dadosNotas.nota3) / 3).toFixed(2);
                const docId = `${materia}_${bimestre}`; // Ex: "portugues_1"
                
                await setDoc(
                    doc(db, "alunos", matricula, "notas", docId),
                    { 
                        ...dadosNotas, 
                        materia: materia,
                        bimestre: bimestre,
                        media: parseFloat(media),
                        atualizadoEm: new Date(),
                        alunoId: matricula
                    },
                    { merge: true }
                );

                console.log(`✅ ${materia} (${bimestre}° bim) salva - Média: ${media}`);
            }

            alert(`🎉 Todas as notas do ${bimestre}° bimestre foram salvas com sucesso!`);
            this.mostrarResumoNotas(notas, bimestre);

        } catch (error) {
            console.error("❌ Erro ao salvar notas:", error);
            alert("Erro ao salvar notas: " + error.message);
        }
    }

    mostrarResumoNotas(notas, bimestre) {
        let resumo = `📊 Resumo das Notas - ${bimestre}° Bimestre:\n\n`;
        
        for (const [materia, dados] of Object.entries(notas)) {
            const media = ((dados.nota1 + dados.nota2 + dados.nota3) / 3).toFixed(1);
            const status = media >= 6 ? "✅ Aprovado" : "❌ Recuperação";
            
            resumo += `${this.formatarMateria(materia)}: ${dados.nota1} | ${dados.nota2} | ${dados.nota3} → Média: ${media} - ${status}\n`;
        }
        
        console.log(resumo);
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

// Inicializa o sistema de notas
new CadastroNotas();