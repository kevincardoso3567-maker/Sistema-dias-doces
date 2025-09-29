// =================================================================
// FUNÇÕES DE MÁSCARA E AUXILIARES
// =================================================================

function removeMascara(valor) {
    // Remove "R$", espaços, pontos de milhar, e troca a vírgula decimal por ponto
    return valor.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
}

function formatarMoeda(input) {
    let valor = input.value;
    
    // 1. Remove tudo que não for dígito
    valor = valor.replace(/\D/g, ''); 

    if (valor.length === 0) {
        input.value = '';
        return;
    }
    
    // Remove zeros à esquerda (corrige o bug)
    if (valor.length > 1 && valor.startsWith('0')) {
        valor = valor.replace(/^0+/, '');
    }

    // Garante no mínimo 3 dígitos (para centavos)
    if (valor.length === 1) {
        valor = '00' + valor; 
    } else if (valor.length === 2) {
        valor = '0' + valor; 
    }
    
    // 2. Separa a parte inteira e a parte decimal
    let inteiro = valor.slice(0, valor.length - 2);
    let decimal = valor.slice(valor.length - 2);

    // 3. Adiciona o separador de milhar (ponto)
    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if (inteiro === '') {
        inteiro = '0';
    }
    
    // 4. Aplica a máscara final
    input.value = `R$ ${inteiro},${decimal}`;
}


const formatarMoedaExibicao = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getStatusClass = (status) => {
    return status === 'Producao' ? 'status-producao' : 'status-sem-fabricacao';
};

// =================================================================
// VARIÁVEIS GLOBAIS E PERSISTÊNCIA (LOCALSTORAGE)
// =================================================================

let produtos = []; 
let produtoIdCounter = 0;
let ultimoExcluido = null; 
// Removido: itensSimulacao

function salvarProdutos() {
    // Removido: localStorage.setItem('itensSimulacao', ...);
    localStorage.setItem('produtosCadastrados', JSON.stringify(produtos));
    localStorage.setItem('produtoIdCounter', produtoIdCounter);
}

function carregarProdutos() {
    const dadosSalvos = localStorage.getItem('produtosCadastrados');
    const contadorSalvo = localStorage.getItem('produtoIdCounter');
    
    if (dadosSalvos) {
        produtos = JSON.parse(dadosSalvos); 
    }
    
    if (contadorSalvo) {
        produtoIdCounter = parseInt(contadorSalvo);
    }
}


// =================================================================
// LÓGICA PRINCIPAL E MANIPULAÇÃO DO DOM
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroProduto');
    const listaProdutos = document.getElementById('listaProdutos');
    const btnUndoContainer = document.getElementById('btnUndoContainer');
    const btnExportarPdf = document.getElementById('btnExportarPdf'); 
    
    // Elementos da Simulação
    const selectProdutoOrcamento = document.getElementById('selectProdutoOrcamento');
    const precoUnitarioOrcamentoInput = document.getElementById('precoUnitarioOrcamento');
    const quantidadeOrcamentoInput = document.getElementById('quantidadeOrcamento');
    const precoTotalOrcamentoInput = document.getElementById('precoTotalOrcamento');

    carregarProdutos();

    // Função que renderiza a tabela de Produtos
    function renderizarTabela() {
        listaProdutos.innerHTML = ''; 

        // Lógica do botão Desfazer...
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
        
        produtos.forEach(produto => {
            const row = listaProdutos.insertRow();
            row.id = `produto-${produto.id}`; 

            row.insertCell().textContent = produto.id; 
            row.insertCell().textContent = produto.nome; 
            row.insertCell().textContent = produto.categoria; 
            row.insertCell().textContent = produto.tamanhoMedio; 
            
            const statusCell = row.insertCell(); 
            statusCell.textContent = produto.status;
            statusCell.classList.add(getStatusClass(produto.status)); 
            
            row.insertCell().textContent = formatarMoedaExibicao(produto.precoUnitario); 
            
            const acoesCell = row.insertCell(); 
            acoesCell.classList.add('acoes-botoes');
            
            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.classList.add('btn-editar');
            btnEditar.dataset.id = produto.id;
            btnEditar.addEventListener('click', iniciarEdicao);
            acoesCell.appendChild(btnEditar);

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.classList.add('btn-excluir'); 
            btnExcluir.dataset.id = produto.id;
            btnExcluir.addEventListener('click', excluirProduto);
            acoesCell.appendChild(btnExcluir);
        });
        
        // Atualiza a calculadora de orçamento
        preencherSelectOrcamento();
    }
    
    // Tratamento do formulário ao SALVAR
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const precoUnitarioInput = document.getElementById('precoUnitario');
        
        let precoUnitarioFormatado = removeMascara(precoUnitarioInput.value);
        const precoUnitario = parseFloat(precoUnitarioFormatado);

        if (isNaN(precoUnitario)) {
             alert("Por favor, digite um valor válido para o Preço Unitário.");
             return;
        }

        const nome = document.getElementById('nomeProduto').value;
        const categoria = document.getElementById('categoria').value;
        const tamanhoMedio = document.getElementById('tamanhoMedio').value;
        const status = document.getElementById('status').value;
        
        
        const novoProduto = {
            id: ++produtoIdCounter, 
            nome: nome,
            categoria: categoria,
            tamanhoMedio: tamanhoMedio,
            status: status,
            precoUnitario: precoUnitario 
        };

        produtos.push(novoProduto); 
        ultimoExcluido = null;
        form.reset(); 
        
        renderizarTabela();
        salvarProdutos();
    });

    // Funções de Exclusão (Simplificada)
    function excluirProduto(event) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) {
            return;
        }

        const id = parseInt(event.target.dataset.id);
        const index = produtos.findIndex(p => p.id === id);

        if (index > -1) {
            ultimoExcluido = produtos.splice(index, 1)[0]; 
            
            renderizarTabela();
            salvarProdutos(); 
        }
    }

    function desfazerExclusao() {
        if (ultimoExcluido) {
            produtos.push(ultimoExcluido); 
            produtos.sort((a, b) => a.id - b.id); 
            ultimoExcluido = null;
            
            renderizarTabela();
            salvarProdutos(); 
        }
    }
    
    // Função Iniciar Edição (Correta)
    function iniciarEdicao(event) {
        const id = parseInt(event.target.dataset.id);
        const row = document.getElementById(`produto-${id}`);
        const produto = produtos.find(p => p.id === id);
        
        // Mapeamento: 1=Nome, 2=Categoria, 3=Tamanho, 4=Status, 5=Preço Unitário
        const fieldsToEdit = [1, 2, 3, 4, 5]; 
        
        fieldsToEdit.forEach(i => {
            const cell = row.cells[i];
            const valorAtual = cell.textContent;
            cell.textContent = ''; // Limpa a célula
            
            if (i === 2) { // Categoria
                const select = document.createElement('select');
                select.classList.add('input-edicao');
                select.id = 'edit-categoria-' + id;
                const categorias = ["Bolos simples", "Bolos recheados", "Doces", "Salgados", "Pães", "Torta na marmita"];
                
                categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    if (cat === produto.categoria) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                cell.appendChild(select);
                
            } else if (i === 4) { // Status
                const select = document.createElement('select');
                select.classList.add('input-edicao');
                select.id = 'edit-status-' + id;
                const statusOptions = ["Producao", "Sem Fabricacao"];
                
                statusOptions.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status === 'Producao' ? 'Produção' : 'Sem Fabricação';
                    if (status === produto.status) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                cell.appendChild(select);
                
            } else if (i === 5) { // Preço Unitário
                const input = document.createElement('input');
                input.type = 'text'; 
                input.classList.add('input-edicao');
                // Remove R$ para edição
                let valorSemSimbolo = valorAtual.replace('R$', '').trim();
                input.value = formatarMoedaExibicao(produto.precoUnitario).replace('R$ ', '');
                input.onkeyup = function() { formatarMoeda(this); };
                cell.appendChild(input);
                
            } else { // Nome e Tamanho Médio
                const input = document.createElement('input');
                input.type = 'text';
                input.classList.add('input-edicao');
                input.value = valorAtual;
                cell.appendChild(input);
            }
        });

        const acoesCell = row.cells[6]; 
        acoesCell.innerHTML = '';
        
        const btnSalvarEdicao = document.createElement('button');
        btnSalvarEdicao.textContent = 'Salvar';
        btnSalvarEdicao.classList.add('btn-salvar'); 
        btnSalvarEdicao.dataset.id = id;
        btnSalvarEdicao.addEventListener('click', salvarEdicao);
        acoesCell.appendChild(btnSalvarEdicao);
    }
    
    // Função Salvar Edição (Tabela Produtos)
    function salvarEdicao(event) {
        const id = parseInt(event.target.dataset.id);
        const row = document.getElementById(`produto-${id}`);
        const produtoIndex = produtos.findIndex(p => p.id === id);

        if (produtoIndex === -1) return;
        
        // Lê o valor de preço e remove a máscara
        let precoUnitarioFormatado = row.cells[5].querySelector('input').value;
        let precoUnitarioNumerico = removeMascara(precoUnitarioFormatado);
        const precoUnitario = parseFloat(precoUnitarioNumerico);
        
        if (isNaN(precoUnitario)) {
             alert("Valor de preço inválido na edição. Certifique-se de usar apenas números.");
             return;
        }

        // Lê os valores dos inputs e selects
        const nome = row.cells[1].querySelector('input').value;
        const categoria = row.cells[2].querySelector('select').value; 
        const tamanhoMedio = row.cells[3].querySelector('input').value;
        const status = row.cells[4].querySelector('select').value; 
        
        
        produtos[produtoIndex].nome = nome;
        produtos[produtoIndex].categoria = categoria;
        produtos[produtoIndex].tamanhoMedio = tamanhoMedio;
        produtos[produtoIndex].status = status;
        produtos[produtoIndex].precoUnitario = precoUnitario;

        // NÃO há mais simulação para atualizar aqui, apenas a lista
        
        renderizarTabela(); 
        salvarProdutos();
    }


    // =================================================================
    // LÓGICA DA SIMULAÇÃO (CALCULADORA DE ITEM ÚNICO)
    // =================================================================
    
    // 1. Preenche o SELECT com os produtos
    function preencherSelectOrcamento() {
        // Limpa e preenche o select
        selectProdutoOrcamento.innerHTML = '<option value="" disabled selected>Selecione um Produto</option>';
        produtos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id; 
            option.textContent = produto.nome; // Exibe só o nome
            option.dataset.preco = produto.precoUnitario; // Armazena o preço no data-attribute
            selectProdutoOrcamento.appendChild(option);
        });
        
        // Reseta os campos de entrada
        precoUnitarioOrcamentoInput.value = formatarMoedaExibicao(0);
        quantidadeOrcamentoInput.value = 1;
        precoTotalOrcamentoInput.value = formatarMoedaExibicao(0);
    }
    
    // 2. Puxa o preço unitário ao selecionar um produto
    window.atualizarPrecoUnitario = function(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const precoStr = selectedOption.dataset.preco;
        
        let precoUnitarioNumerico = parseFloat(precoStr);
        
        if (isNaN(precoUnitarioNumerico)) {
             precoUnitarioOrcamentoInput.value = formatarMoedaExibicao(0);
        } else {
             precoUnitarioOrcamentoInput.value = formatarMoedaExibicao(precoUnitarioNumerico);
        }
        calcularPrecoTotal();
    }

    // 3. Calcula o preço total ao digitar a quantidade
    window.calcularPrecoTotal = function() {
        const precoUnitarioFormatado = precoUnitarioOrcamentoInput.value;
        // Garante que a quantidade seja no mínimo 1 ou 0
        const quantidade = parseInt(quantidadeOrcamentoInput.value) || 0;

        const precoUnitarioNumerico = parseFloat(removeMascara(precoUnitarioFormatado));
        
        if (isNaN(precoUnitarioNumerico)) {
            precoTotalOrcamentoInput.value = formatarMoedaExibicao(0);
            return;
        }

        const precoTotal = precoUnitarioNumerico * quantidade;
        
        precoTotalOrcamentoInput.value = formatarMoedaExibicao(precoTotal);
    }
    
    // 4. Copiar o resultado para uso externo (botão "Adicionar Item" foi trocado)
    window.copiarResultado = function() {
        const produto = selectProdutoOrcamento.options[selectProdutoOrcamento.selectedIndex].textContent;
        const precoUnitario = precoUnitarioOrcamentoInput.value;
        const quantidade = quantidadeOrcamentoInput.value;
        const precoTotal = precoTotalOrcamentoInput.value;

        if (precoTotal === formatarMoedaExibicao(0) || !produto || produto === "Selecione um Produto") {
            alert("Selecione um produto e uma quantidade válida para calcular o resultado.");
            return;
        }

        const textoCopia = `Orçamento:\nProduto: ${produto}\nPreço Unitário: ${precoUnitario}\nQuantidade: ${quantidade}\nPreço Total: ${precoTotal}`;
        
        navigator.clipboard.writeText(textoCopia).then(() => {
            alert("Resultado copiado para a área de transferência:\n\n" + textoCopia);
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
            alert('Erro ao copiar para a área de transferência. Tente novamente.');
        });
    }


    // =================================================================
    // FUNÇÃO DE EXPORTAÇÃO PARA PDF
    // =================================================================
    function exportarParaPdf() {
        // ... (Função completa, mantida)
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('A biblioteca jsPDF não foi carregada corretamente.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('L', 'mm', 'a4'); 

        const title = "Lista de Produtos Cadastrados";
        doc.setFontSize(18);
        doc.text(title, 14, 20);

        const head = [['ID', 'Produto', 'Categoria', 'Tamanho Médio', 'Status', 'Preço Unitário']];
        
        const body = produtos.map(p => {
            const precoExibicao = formatarMoedaExibicao(p.precoUnitario);
            return [p.id, p.nome, p.categoria, p.tamanhoMedio, p.status, precoExibicao];
        });

        doc.autoTable({
            head: head,
            body: body,
            startY: 25, 
            theme: 'striped',
            headStyles: { fillColor: [255, 170, 50], textColor: 255, fontStyle: 'bold' },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 4) { 
                    const status = data.row.raw[4]; 
                    if (status === 'Producao') {
                        data.cell.styles.fillColor = [212, 237, 218];
                        data.cell.styles.textColor = [21, 87, 36];
                    } else if (status === 'Sem Fabricacao') {
                        data.cell.styles.fillColor = [248, 215, 218];
                        data.cell.styles.textColor = [114, 28, 36];
                    }
                }
            }
        });

        window.open(doc.output('dataurlnewwindow'), '_blank');
    }

    // Associa a função ao clique do botão
    btnExportarPdf.addEventListener('click', exportarParaPdf);

    // Inicia a aplicação
    renderizarTabela();
});