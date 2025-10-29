//Menu dropdown

const toggleBtn = document.querySelector(".dropdown_toggle_btn");
const dropdownsMenu = document.querySelector(".profile-dropdown_menu");
    
function toggleDropdowns(){
    dropdownsMenu.classList.toggle("active");
}
toggleBtn.addEventListener("click", toggleDropdowns);

//Cartão aluno

const studentCards = document.querySelectorAll(".aluno01, .aluno02");
studentCards.forEach(card => {
    card.addEventListener("click", () => {
        const studentId = card.getAttribute("data-student-id");
        window.location.href = `detalhes_aluno.html?studentId=${studentId}`;
    });
});
