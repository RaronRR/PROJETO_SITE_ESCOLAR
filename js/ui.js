/**
 * Recebe a lista de alunos e cria os cartões no DOM.
 * @param {Array<Object>} alunos - Lista de alunos com { id, nome, turma, etc. }
 */
 function renderizarCardsAlunos(alunos) {
    
    const container = document.querySelector(".cards_container"); 
    container.innerHTML = ''; 
    
    alunos.forEach((aluno, index) => {
        
        const cardClass = (index % 2 === 0) ? 'aluno01' : 'aluno02';
        const card = document.createElement("div");
        card.className = cardClass;
        card.dataset.studentId = aluno.id;

        card.innerHTML = `
            <h3>Aluno: ${aluno.nome}</h3>
            <p>Turma: ${aluno.turma}</p>
        `;
        container.appendChild(card);      
    });    

    adicionarListenersNosCards();   
}

function handleCardClick(e) {
    const studentId = e.currentTarget.dataset.studentId;

    localStorage.setItem('currentStudentId', studentId); 
    document.body.classList.add('dashboard-ativa');
    
    const dashboardContent = document.querySelector('.dashboard_content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block'; 
    }
    console.log("Card do aluno clicado, ID:", studentId);
}

export function adicionarListenersNosCards() {
    const cardsAluno = document.querySelectorAll('.aluno01, .aluno02');  

    cardsAluno.forEach(card => {
        card.addEventListener("click", handleCardClick);
    })
}

