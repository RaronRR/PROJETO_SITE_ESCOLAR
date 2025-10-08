//Area que o administrador colocarar as informações semanais

let admin_novo_aviso = document.getElementById("adicionar_avisos");
admin_novo_aviso.addEventListener("submit", novoAviso);

function novoAviso(event){
    //Impede que a pagina recarregue
    event.preventDefault();

    let aviso = document.getElementById("novo_aviso").value;
    let dadosDoAviso = { "aviso": aviso };
    let jsonParaEnviar = JSON.stringify(dadosDoAviso);

    let url = 'placeholder';
    let method = 'POST';

    if (avisoEditandoId) {
        url = `placeholder/aviso/${avisoEditandoId}`;
        method = 'PUT';
        console.log("Modo de edição: Enviando PUT para:", url);
    } else {
        console.log("Modo de criação: Enviando POST para:", url);
    }

    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: jsonParaEnviar,
    })

    .then(response =>{
        if(response.ok){
            if(method === 'PUT'){
                console.log("Aviso editado com sucesso");
                limparEstadoEdicao();

            }else{
            console.log("Aviso envidado com sucesso");
            }
            listaDeAviso();

        }else{
            console.error(`Erro ao processar aviso (${method}):`, response.status)
        }   
    })
    .catch(error =>{
        console.error("Erro na conexão", error)
    })

    console.log("Dados prontos para enviar:", jsonParaEnviar)

    
}

function listaDeAviso(){
    fetch('placeholder')
    .then(response =>{
        if(!response.ok){
            console.error("Erro ao listar os avisos:", response.status);
            return;
        }
        return response.json();
    })

    .then(avisos => {
        console.log("Avisos recebidos:", avisos)
        let listaDeAviso = document.getElementById("ListaDeAvisos");

        listaDeAviso.innerHTML = '';

        if (avisos && Array.isArray(avisos)){
            avisos.forEach(aviso => {        
            
            //Codigo que irar criar um novo paragrafo para inserir um aviso
            let novoParagrafo = document.createElement('p');
            novoParagrafo.textContent = aviso.aviso;
            listaDeAviso.appendChild(novoParagrafo);

            //Codigo que ira criar um botão de editar e salvar os avisos
            let editaAviso = document.createElement('button');
            editaAviso.setAttribute('data-id', aviso.id);
            editaAviso.textContent = 'Editar';
            listaDeAviso.appendChild(editaAviso);
            editaAviso.addEventListener('click', function(){
                iniciarEdicao(aviso.id);
            });

            let deletarAviso = document.createElement('button');
            deletarAviso.textContent = 'Deletar';
            listaDeAviso.appendChild(deletarAviso);
            deletarAviso.addEventListener('click', function(){
                confirmarExclusao(aviso.id);
            });
        });
        
        }else{
            console.warn("Nenhum aviso para listar ou a API retornou um formato inesperado.")};
    })

    .catch(error => {
        console.error("Erro de conexão", error);
    })  
}

let avisoEditandoId = null;

function iniciarEdicao(idAviso){

    console.log("ID dos avisor recebidos", idAviso);

    fetch(`placeholder/aviso/${idAviso}`)
    .then(response => {
        if(!response.ok){
            console.error("Erro ao buscar aviso", response.status);
            return;
        }
        return response.json();
    })
    .then(avisoRetornado =>{
        console.log("Aviso para edição", avisoRetornado);

        let campoAviso = document.getElementById('novo_aviso');
        campoAviso.value = avisoRetornado.aviso;

        let auteraBotão = document.getElementById('btn_enviar');
        auteraBotão.innerHTML = "Salvar Alteração"

        avisoEditandoId = idAviso;
    })
    .catch(error => {
        console.error("Erro na conexão GET", error);
     }) 
}

function limparEstadoEdicao() {
    
    avisoEditandoId = null; 
    document.getElementById('novo_aviso').value = '';

    document.getElementById('btn_enviar').textContent = "Enviar aviso";
    
    console.log("Modo de edição finalizado. Formulário pronto para novo aviso.");
}

function confirmarExclusao(idAviso){
    let confirmar = confirm("Tem certeza que deseja deletar o item?");

    if(confirmar){
        fetch(`placeholder/aviso/${idAviso}`
            ,{ method: 'DELETE', }
        )
        
        .then(response => {
            if(response.ok){
                console.log(`Aviso ${idAviso} deletado com sucesso!`);
                listaDeAviso()
            } else{
                console.error("Erro ao deletar", response.status)
            }
        })

        .catch(error => { 
            console.error("Erro na conexão DELETE:", error)
        })
    } else{
        console.log("Exclusão cancelada")
    }
}
