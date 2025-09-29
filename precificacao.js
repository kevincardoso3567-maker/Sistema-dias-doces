// =================================================================
// CHAVES DE ARMAZENAMENTO E FUNÇÕES AUXILIARES
// =================================================================

const INGREDIENTES_KEY = 'ingredientesCalculados';
const CONTAS_KEY = 'contasFixasCalculadas'; 
const ITENS_KEY = 'itensEmbalagemCalculados'; 

const formatarMoedaExibicao = (valor) => {
    // ... [Função mantida] ...
    return parseFloat(valor).toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4
    });
};

const formatarTotalMoeda = (valor) => {
    // ... [Função mantida] ...
    return parseFloat(valor).toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });
};

function carregarDadosCalculados(key) {
    // ... [Função mantida] ...
    const dadosSalvos = localStorage.getItem(key);
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
}

// =================================================================
// ESTRUTURA DE DADOS (GLOBAL)
// =================================================================

let dadosBrutos = {
    ingredientes: [],
    contas: [],
    itens: []
};

let listaPrecificacao = {
    ingredientes: [],
    contas: [],
    itens: []
};


function inicializarDados() {
    // ... [Função mantida] ...
    dadosBrutos.ingredientes = carregarDadosCalculados(INGREDIENTES_KEY);
    dadosBrutos.contas = carregarDadosCalculados(CONTAS_KEY);
    dadosBrutos.itens = carregarDadosCalculados(ITENS_KEY);
}


// =================================================================
// FUNÇÕES DE CÁLCULO E MANIPULAÇÃO
// =================================================================

function encontrarCustoUnitario(categoria, nomeItem) {
    // ... [Função mantida] ...
    const lista = dadosBrutos[categoria];
    const itemEncontrado = lista.find(item => item.nome === nomeItem);
    
    let chaveCusto;
    if (categoria === 'ingredientes') chaveCusto = 'custoUnitario';
    else if (categoria === 'contas') chaveCusto = 'custoPorHora';
    else if (categoria === 'itens') chaveCusto = 'precoPorUnidade';

    return itemEncontrado ? itemEncontrado[chaveCusto] : 0;
}

function adicionarItemSelecionado(selectElement, categoria) {
    // ... [Função mantida] ...
    const nomeSelecionado = selectElement.value;
    
    if (!nomeSelecionado) {
        return;
    }
    
    const custo = encontrarCustoUnitario(categoria, nomeSelecionado);
    
    const novoItem = {
        nome: nomeSelecionado,
        custoUnitario: custo,
        quantidadeUsada: 1, 
        total: custo
    };

    listaPrecificacao[categoria].push(novoItem);
    renderizarTabela(categoria);
}


function calcularTotais(categoria) {
    // ... [Função mantida] ...
    let subtotal = 0;
    const lista = listaPrecificacao[categoria];
    const tbody = document.getElementById(`lista${categoria.charAt(0).toUpperCase() + categoria.slice(1)}Body`);
    
    lista.forEach((item, index) => {
        const inputQuantidade = tbody.querySelector(`#item-${categoria}-${index} input[type="number"]`);
        
        if (inputQuantidade) {
            const quantidade = parseInt(inputQuantidade.value) || 0; 
            const total = item.custoUnitario * quantidade;
            
            item.quantidadeUsada = quantidade;
            item.total = total;
            
            const celulaTotal = tbody.querySelector(`#item-${categoria}-${index} td:nth-child(4)`);
            if (celulaTotal) {
                celulaTotal.textContent = formatarTotalMoeda(total);
            }
            
            subtotal += total;
        }
    });

    const subtotalElement = document.getElementById(`subtotal${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`);
    if (subtotalElement) {
        subtotalElement.textContent = formatarTotalMoeda(subtotal);
    }
    
    calcularCustoTotalGeral();
}

/**
 * Função para atualizar o nome do produto no resumo.
 */
function atualizarNomeProdutoResumo() {
    // ... [Função mantida] ...
    const inputNomeProduto = document.getElementById('nomeProduto');
    const displayNomeProduto = document.getElementById('resumoNomeProduto');
    
    if (inputNomeProduto && displayNomeProduto) {
        const nome = inputNomeProduto.value.trim();
        displayNomeProduto.textContent = `Produto: ${nome || 'Não Informado'}`;
    }
}

/**
 * Calcula e exibe os totais por categoria, Mão de Obra e o Custo Total Geral.
 */
function calcularCustoTotalGeral() {
    // ... [Função mantida] ...
    const totalIngredientes = listaPrecificacao.ingredientes.reduce((sum, item) => sum + item.total, 0);
    const totalContas = listaPrecificacao.contas.reduce((sum, item) => sum + item.total, 0);
    const totalItens = listaPrecificacao.itens.reduce((sum, item) => sum + item.total, 0);

    const subtotalDireto = totalIngredientes + totalContas + totalItens;

    const inputMaoDeObra = document.getElementById('inputMaoDeObra');
    
    if (inputMaoDeObra && !inputMaoDeObra.hasAttribute('data-listener-added')) {
        inputMaoDeObra.addEventListener('input', calcularCustoTotalGeral);
        inputMaoDeObra.setAttribute('data-listener-added', 'true');
    }

    const valorMaoDeObra = inputMaoDeObra ? (parseFloat(inputMaoDeObra.value) || 0) : 0;
    
    const custoGeral = subtotalDireto + valorMaoDeObra;

    const displayIngredientes = document.getElementById('totalIngredientesDisplay');
    const displayContas = document.getElementById('totalContasDisplay');
    const displayItens = document.getElementById('totalItensDisplay');
    const displaySubtotalDireto = document.getElementById('subtotalDireto');

    if (displayIngredientes) displayIngredientes.textContent = formatarTotalMoeda(totalIngredientes);
    if (displayContas) displayContas.textContent = formatarTotalMoeda(totalContas);
    if (displayItens) displayItens.textContent = formatarTotalMoeda(totalItens);
    if (displaySubtotalDireto) displaySubtotalDireto.textContent = formatarTotalMoeda(subtotalDireto);
    
    const custoGeralElement = document.getElementById('custoTotalGeral');
    if (custoGeralElement) {
        custoGeralElement.textContent = formatarTotalMoeda(custoGeral);
    }
}


// =================================================================
// GESTÃO DO DOM E RENDERIZAÇÃO
// =================================================================
function criarSeletorItem(categoria, selectedValue, onchangeHandler) {
    // ... [Função mantida] ...
    const selectElement = document.createElement('select');
    selectElement.onchange = onchangeHandler;
    
    const dados = dadosBrutos[categoria];
    
    selectElement.innerHTML = `<option value="">--- Selecione um Item ---</option>`; 
    
    if (dados.length === 0) {
        selectElement.innerHTML = `<option value="">⚠️ Cadastre Itens</option>`;
        selectElement.disabled = true;
    } else {
        dados.forEach(item => {
             const option = document.createElement('option');
             option.value = item.nome;
             
             let custoDisplay;
             if (categoria === 'ingredientes') custoDisplay = formatarMoedaExibicao(item.custoUnitario);
             else if (categoria === 'contas') custoDisplay = formatarMoedaExibicao(item.custoPorHora);
             else if (categoria === 'itens') custoDisplay = formatarMoedaExibicao(item.precoPorUnidade);

             option.textContent = `${item.nome} (${custoDisplay})`; 
             selectElement.appendChild(option);
        });
    }

    if (selectedValue) {
        selectElement.value = selectedValue;
    }

    return selectElement;
}


function renderizarTabela(categoria) {
    // ... [Função mantida] ...
    const lista = listaPrecificacao[categoria];
    const tbody = document.getElementById(`lista${categoria.charAt(0).toUpperCase() + categoria.slice(1)}Body`);
    
    if (!tbody) return; 

    tbody.innerHTML = '';
    
    lista.forEach((item, index) => {
        const row = tbody.insertRow();
        row.id = `item-${categoria}-${index}`; 
        
        const selectCell = row.insertCell();
        
        const updateHandler = () => {
            const selectElement = row.querySelector('select');
            const novoNome = selectElement.value;
            
            if (!novoNome) {
                removerLinha(categoria, index);
                return;
            }

            const novoCusto = encontrarCustoUnitario(categoria, novoNome);
            
            listaPrecificacao[categoria][index].nome = novoNome;
            listaPrecificacao[categoria][index].custoUnitario = novoCusto;
            
            row.querySelector(`td:nth-child(2)`).textContent = formatarMoedaExibicao(novoCusto);
            row.querySelector('input[type="number"]').dispatchEvent(new Event('input'));
        };
        
        const selectElement = criarSeletorItem(categoria, item.nome, updateHandler);
        selectCell.appendChild(selectElement);
        
        row.insertCell().textContent = formatarMoedaExibicao(item.custoUnitario);
        
        const cellQuantidade = row.insertCell();
        const inputQuantidade = document.createElement('input');
        inputQuantidade.type = 'number';
        inputQuantidade.min = '0';
        inputQuantidade.step = '1';
        inputQuantidade.value = item.quantidadeUsada;
        
        inputQuantidade.oninput = () => {
             inputQuantidade.value = parseInt(inputQuantidade.value) || 0;
             calcularTotais(categoria);
        };
        cellQuantidade.appendChild(inputQuantidade);
        
        row.insertCell().textContent = formatarTotalMoeda(item.total);

        const acoesCell = row.insertCell();
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'Remover';
        btnRemover.classList.add('btn-remover');
        btnRemover.onclick = () => removerLinha(categoria, index);
        acoesCell.appendChild(btnRemover);
    });
    
    const rowSelecao = tbody.insertRow();
    rowSelecao.classList.add('row-selecao-permanente'); 
    rowSelecao.id = `seletor-permanente-${categoria}`;

    const cellNome = rowSelecao.insertCell();
    const addHandler = () => adicionarItemSelecionado(selectElementPermanente, categoria);
    const selectElementPermanente = criarSeletorItem(categoria, "", addHandler);
    selectElementPermanente.style.fontWeight = 'bold';
    cellNome.appendChild(selectElementPermanente);
    
    rowSelecao.insertCell().textContent = '-'; 
    rowSelecao.insertCell().textContent = '-'; 
    rowSelecao.insertCell().textContent = '-'; 

    rowSelecao.insertCell().textContent = ''; 
    
    renderizarFooter(categoria);
    calcularTotais(categoria);
}


function renderizarFooter(categoria) {
    // ... [Função mantida] ...
    const tfoot = document.getElementById(`rodape${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`);
    
    if (!tfoot) return;

    tfoot.innerHTML = ''; 

    const rowSubtotal = tfoot.insertRow();
    rowSubtotal.innerHTML = `
        <td colspan="3" style="text-align: right; border-top: 2px solid #333;"><strong>SUBTOTAL ${categoria.toUpperCase()}:</strong></td>
        <td id="subtotal${categoria.charAt(0).toUpperCase() + categoria.slice(1)}" style="border-top: 2px solid #333;">R$ 0,00</td>
        <td style="border-top: 2px solid #333;"></td>
    `;
}


// =================================================================
// FUNÇÕES DE INTERAÇÃO (REMOVER E PDF)
// =================================================================

function removerLinha(categoria, index) {
    // ... [Função mantida] ...
    if (confirm(`Tem certeza que deseja remover este item de ${categoria}?`)) {
        listaPrecificacao[categoria].splice(index, 1);
        
        renderizarTabela(categoria);
        
        calcularCustoTotalGeral();
    }
}

/**
 * Função que aciona a impressão da página, usando o CSS @media print
 * para formatar o relatório.
 */
function exportarParaPdf() {
    // Garante que os valores no resumo estejam atualizados antes de imprimir
    atualizarNomeProdutoResumo();
    calcularCustoTotalGeral();
    
    // Abre a visualização de impressão/PDF do navegador
    window.print();
}

// =================================================================
// INICIALIZAÇÃO DA PÁGINA
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarDados();
    
    renderizarTabela('ingredientes');
    renderizarTabela('contas');
    renderizarTabela('itens');
    
    const inputNomeProduto = document.getElementById('nomeProduto');
    if (inputNomeProduto) {
        inputNomeProduto.addEventListener('input', atualizarNomeProdutoResumo); 
    }
    
    // NOVO: Adiciona listener para o botão de exportar PDF
    const btnPdf = document.getElementById('exportarPdfBtn');
    if (btnPdf) {
        btnPdf.addEventListener('click', exportarParaPdf);
    }
    
    atualizarNomeProdutoResumo();
    calcularCustoTotalGeral();
});