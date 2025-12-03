import { auth } from '../../firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const headerCSS = `
<style>
    .admin-header {
        background: #007bff;
        color: white;
        padding: 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
    }
    
    .admin-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .nav-logo {
        font-size: 1.5em;
        font-weight: bold;
        color: white;
        text-decoration: none;
    }
    
    .nav-links {
        display: flex;
        gap: 20px;
    }
    
    .nav-links a {
        color: white;
        text-decoration: none;
        padding: 8px 15px;
        border-radius: 5px;
        transition: background 0.3s;
    }
    
    .nav-links a:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .nav-user {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    #logoutBtn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
    }
    
    #logoutBtn:hover {
        background: #c82333;
    }
    
    /* Ajusta o conteúdo para não ficar atrás do header */
    body {
        padding-top: 80px;
    }
</style>
`;

// HTML do header
const headerHTML = `
<div class="admin-header">
    <div class="admin-nav">
        <a href="admin_pagina.html" class="nav-logo">🏫 Sistema Escola</a>
        <div class="nav-links">
            <a href="cadastro_aluno.html">👨‍🎓 Alunos</a>
            <a href="cadastro_notas.html">📊 Notas</a>
            <a href="cadastro_comunicados.html">📢 Comunicados</a>
            <a href="calendario_inserir.html">📅 Calendário</a>
            <a href="chat_adm.html">💬 Chat</a>
        </div>
        <div class="nav-user">
            <span id="currentUser">Admin</span>
            <button id="logoutBtn">🚪 Sair</button>
        </div>
    </div>
</div>
`;

// Adiciona CSS e HTML à página
document.head.insertAdjacentHTML('beforeend', headerCSS);
document.body.insertAdjacentHTML('afterbegin', headerHTML);

onAuthStateChanged(auth, (user) => {
        if (user) {
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        } else {
            window.location.href = '../index.html';
        }
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("🚪 Usuario deslogado");
                window.location.href = '../index.html';
            } catch (error) {
            }
        });
    }

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '../../index.html';
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
});

console.log("✅ Header Admin instalado!");