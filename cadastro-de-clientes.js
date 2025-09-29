document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastro');
    const listaClientes = document.getElementById('listaClientes');
    const btnUndoContainer = document.getElementById('btnUndoContainer');
    
    // REMOVIDO: const btnGerarPdf = document.getElementById('btnGerarPdf'); 

    let clientes = [];
    let clienteIdCounter = 0;
    let ultimoExcluido = null;

    // REMOVIDO: A função gerarDownloadPdfSimples foi removida

    // REMOVIDO: O event listener do botão de PDF foi removido

    // ----------------------------------------------------
    // FUNÇÕES DE PERSISTÊNCIA (LocalStorage)
    // ----------------------------------------------------

    function carregarDados() {
        const dadosSalvos = localStorage.getItem('clientes');
        const counterSalvo = localStorage.getItem('clienteIdCounter');
        
        if (dadosSalvos) {
            clientes = JSON.parse(dadosSalvos);
        }
        
        if (counterSalvo) {
            clienteIdCounter = parseInt(counterSalvo);
        }
    }

    function salvarDados() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
        localStorage.setItem('clienteIdCounter', clienteIdCounter);
    }
    
    // ----------------------------------------------------
    // FUNÇÕES CORE
    // ----------------------------------------------------

    function renderizarTabela() {
        listaClientes.innerHTML = ''; 

        if (ultimoExcluido) {
            if (!document.getElementById('btnDesfazer')) {
                const btnUndo = document.createElement('button');
                btnUndo.textContent = 'Desfazer Última Exclusão';
                btnUndo.classList.add('btn-undo');
                btnUndo.id = 'btnDesfazer';
                btnUndo.addEventListener('click', desfazerExclusao);
                btnUndoContainer.appendChild(btnUndo);
            }
            document.getElementById('btnDesfazer').style.display = 'inline-block';
        } else if (document.getElementById('btnDesfazer')) {
            document.getElementById('btnDesfazer').style.display = 'none';
        }

        clientes.forEach(cliente => {
            const row = listaClientes.insertRow();
            row.id = `cliente-${cliente.id}`;

            row.insertCell().textContent = cliente.data;
            row.insertCell().textContent = cliente.nome;
            row.insertCell().textContent = cliente.telefone;
            row.insertCell().textContent = cliente.endereco;

            const acoesCell = row.insertCell();
            acoesCell.classList.add('acoes-botoes');
            
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.classList.add('btn-editar');
            btnEditar.dataset.id = cliente.id;
            btnEditar.addEventListener('click', iniciarEdicao);
            acoesCell.appendChild(btnEditar);

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.classList.add('btn-excluir'); 
            btnExcluir.dataset.id = cliente.id;
            btnExcluir.addEventListener('click', excluirCliente);
            acoesCell.appendChild(btnExcluir);
        });
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const dataInput = document.getElementById('data').value || new Date().toLocaleDateString('pt-BR');
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const endereco = document.getElementById('endereco').value;

        const novoCliente = {
            id: ++clienteIdCounter, 
            data: dataInput,
            nome: nome,
            telefone: telefone,
            endereco: endereco
        };

        clientes.push(novoCliente); 
        ultimoExcluido = null; 
        
        salvarDados();
        renderizarTabela(); 
        form.reset(); 
    });

    function excluirCliente(event) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) {
            return;
        }

        const id = parseInt(event.target.dataset.id);
        const index = clientes.findIndex(c => c.id === id);

        if (index > -1) {
            ultimoExcluido = clientes.splice(index, 1)[0]; 
            salvarDados(); 
            renderizarTabela();
        }
    }

    function desfazerExclusao() {
        if (ultimoExcluido) {
            clientes.push(ultimoExcluido); 
            clientes.sort((a, b) => a.id - b.id); 
            ultimoExcluido = null; 
            salvarDados(); 
            renderizarTabela();
        }
    }

    // Funções de Edição (mantidas)
    function iniciarEdicao(event) {
        const id = parseInt(event.target.dataset.id);
        const row = document.getElementById(`cliente-${id}`);
        const cliente = clientes.find(c => c.id === id);

        if (!cliente) return;

        const fields = ['data', 'nome', 'telefone', 'endereco'];

        for (let i = 0; i < fields.length; i++) {
            const cell = row.cells[i];
            const valorAtual = cell.textContent;
            
            const input = document.createElement('input');
            input.type = 'text'; 
            input.value = valorAtual;
            input.classList.add('input-edicao');

            cell.textContent = '';
            cell.appendChild(input);
        }

        const acoesCell = row.cells[4];
        acoesCell.innerHTML = '';
        
        const btnSalvarEdicao = document.createElement('button');
        btnSalvarEdicao.textContent = 'Salvar';
        btnSalvarEdicao.classList.add('btn-salvar'); 
        btnSalvarEdicao.dataset.id = id;
        btnSalvarEdicao.addEventListener('click', salvarEdicao);
        acoesCell.appendChild(btnSalvarEdicao);
    }

    function salvarEdicao(event) {
        const id = parseInt(event.target.dataset.id);
        const row = document.getElementById(`cliente-${id}`);
        const clienteIndex = clientes.findIndex(c => c.id === id);

        if (clienteIndex === -1) return;

        const novosValores = [];
        for (let i = 0; i < 4; i++) {
            novosValores.push(row.cells[i].querySelector('input').value);
        }

        clientes[clienteIndex].data = novosValores[0];
        clientes[clienteIndex].nome = novosValores[1];
        clientes[clienteIndex].telefone = novosValores[2];
        clientes[clienteIndex].endereco = novosValores[3];

        salvarDados(); 
        renderizarTabela(); 
    }
    // Fim das Funções de Edição

    carregarDados();
    renderizarTabela();
});