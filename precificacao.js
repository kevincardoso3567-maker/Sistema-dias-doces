// =================================================================
// CHAVES DE ARMAZENAMENTO E FUNÇÕES AUXILIARES
// =================================================================

// Chaves para puxar as listas de custos CADASTRADAS da calculadora.html
const INGREDIENTES_KEY = 'ingredientesCalculados'; 
const CONTAS_KEY = 'contasFixasCalculadas'; 
const ITENS_KEY = 'itensEmbalagemCalculados'; 
// Chave para salvar o estado da precificação ATUAL (quantidades usadas)
const LISTA_PRECIFICACAO_KEY = 'precificacaoAtual'; 

/**
 * Formata um valor numérico para o padrão de moeda de exibição (R$ 0,0000).
 * Usado para custos unitários/por hora.
 */
const formatarMoedaExibicao = (valor) => {
    return parseFloat(valor).toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4
    });
};

/**
 * Formata um valor numérico para o padrão de total (R$ 0,00).
 * Usado para totais e subtotais.
 */
const formatarTotalMoeda = (valor) => {
    // Garante que o valor é um número
    const num = parseFloat(valor) || 0; 
    return num.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });
};

/**
 * Carrega dados de uma chave específica do LocalStorage.
 */
function carregarDadosCalculados(key) {
    const dadosSalvos = localStorage.getItem(key);
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
}

/**
 * Salva o estado atual da lista de precificação.
 */
function salvarListaPrecificacao() {
    const inputMaoDeObra = document.getElementById('inputMaoDeObra');
    const inputNomeProduto = document.getElementById('nomeProduto');
    
    // NOTA: O valor de Mão de Obra agora é lido e salvo APENAS como texto formatado (ou valor calculado)
    const valorMaoDeObraSalvar = inputMaoDeObra ? inputMaoDeObra.value : ''; 

    const dadosParaSalvar = {
        lista: listaPrecificacao,
        nomeProduto: inputNomeProduto ? inputNomeProduto.value : '',
        // Salvamos o valor EXIBIDO (R$ X,XX) para que ele possa ser recarregado (embora seja recalculado)
        maoDeObraDisplay: valorMaoDeObraSalvar
    };
    
    localStorage.setItem(LISTA_PRECIFICACAO_KEY, JSON.stringify(dadosParaSalvar));
}

// =================================================================
// ESTRUTURA DE DADOS (GLOBAL)
// =================================================================

// Variável para armazenar as listas de itens CADASTRADOS (puxados de calculadora.html)
let dadosBrutos = {
    ingredientes: [],
    contas: [],
    itens: []
};

// Variável para armazenar os itens USADOS na precificação atual
let listaPrecificacao = {
    ingredientes: [], // Armazena { nome, valorTotalCompra }
    contas: [],       // Armazena { nome, custoUnitario, quantidadeUsada, total }
    itens: []         // Armazena { nome, custoUnitario, quantidadeUsada, total }
};


function inicializarDados() {
    // 1. CARREGA OS DADOS BRUTOS CADASTRADOS (Puxa da calculadora.html)
    dadosBrutos.ingredientes = carregarDadosCalculados(INGREDIENTES_KEY);
    dadosBrutos.contas = carregarDadosCalculados(CONTAS_KEY);
    dadosBrutos.itens = carregarDadosCalculados(ITENS_KEY);
    
    // 2. Carrega os dados de PRECIFICACAO salvos (estado da tela atual)
    const dadosSalvos = localStorage.getItem(LISTA_PRECIFICACAO_KEY);
    if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        
        // Atualiza a lista de precificação com o estado salvo
        listaPrecificacao = dados.lista || { ingredientes: [], contas: [], itens: [] };
        
        // Carrega o nome do produto
        const inputNomeProduto = document.getElementById('nomeProduto');
        if (inputNomeProduto && dados.nomeProduto) {
            inputNomeProduto.value = dados.nomeProduto;
        }
        
        // NOTA: O valor da Mão de Obra não é carregado aqui pois será recalculado imediatamente
        //       pela função calcularCustoTotalGeral() no final da inicialização.
    }
}


// =================================================================
// FUNÇÕES DE CÁLCULO E MANIPULAÇÃO
// =================================================================

/**
 * Encontra o custo unitário/total apropriado para um item na lista de DADOS BRUTOS.
 */
function encontrarCusto(categoria, nomeItem) {
    const lista = dadosBrutos[categoria]; 
    const itemEncontrado = lista.find(item => item.nome === nomeItem);
    
    if (!itemEncontrado) return 0;
    
    if (categoria === 'ingredientes') {
        // Puxa o campo 'valor' que é o Custo Total de Compra/Valor Pago
        return itemEncontrado.valor; 
    } else if (categoria === 'contas') {
        // Puxa o campo 'custoPorHora'
        return itemEncontrado.custoPorHora;
    } else if (categoria === 'itens') {
        // Puxa o campo 'precoPorUnidade'
        return itemEncontrado.precoPorUnidade;
    }
    
    return 0;
}

/**
 * Adiciona um item selecionado à lista de precificação.
 */
function adicionarItemSelecionado(selectElement, categoria) {
    const nomeSelecionado = selectElement.value;
    
    if (!nomeSelecionado) {
        return;
    }
    
    // Evita duplicidade simples na lista atual de precificação
    if (listaPrecificacao[categoria].some(item => item.nome === nomeSelecionado)) {
        alert(`O item "${nomeSelecionado}" já foi adicionado. Não é possível adicionar o mesmo item duas vezes.`);
        return;
    }
    
    // Encontra o custo na lista de DADOS BRUTOS
    const custo = encontrarCusto(categoria, nomeSelecionado);
    
    let novoItem;
    
    if (categoria === 'ingredientes') {
        novoItem = {
            nome: nomeSelecionado,
            valorTotalCompra: custo, // O custo é o Valor Pago/Custo Total de Compra
            total: custo 
        };
    } else {
        novoItem = {
            nome: nomeSelecionado,
            custoUnitario: custo,
            quantidadeUsada: 1, // Valor inicial padrão
            total: custo
        };
    }

    listaPrecificacao[categoria].push(novoItem);
    renderizarTabela(categoria);
    selectElement.value = ''; // Reseta o seletor
    
    salvarListaPrecificacao();
}


/**
 * Recalcula o subtotal de uma categoria com base nas quantidades.
 */
function calcularTotais(categoria) {
    let subtotal = 0;
    const lista = listaPrecificacao[categoria];
    const tbody = document.getElementById(`lista${categoria.charAt(0).toUpperCase() + categoria.slice(1)}Body`);
    
    if (categoria === 'ingredientes') {
        // Para ingredientes, apenas soma o valor total de compra (Valor Pago)
        lista.forEach(item => {
            subtotal += item.valorTotalCompra;
        });
        
    } else {
        // Para Contas e Itens, recalcula o total com base no input de quantidade
        lista.forEach((item, index) => {
            const inputQuantidade = tbody.querySelector(`#item-${categoria}-${index} input[type="number"]`);
            
            if (inputQuantidade) {
                const quantidade = parseFloat(inputQuantidade.value) || 0; 
                const total = item.custoUnitario * quantidade;
                
                // Atualiza o estado da lista
                item.quantidadeUsada = quantidade;
                item.total = total;
                
                // Atualiza a célula de total na tabela
                const celulaTotal = tbody.querySelector(`#item-${categoria}-${index} td:nth-child(4)`);
                if (celulaTotal) {
                    celulaTotal.textContent = formatarTotalMoeda(total);
                }
                
                subtotal += total;
            }
        });
    }

    // Atualiza o footer da tabela
    const subtotalElement = document.getElementById(`subtotal${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`);
    if (subtotalElement) {
        subtotalElement.textContent = formatarTotalMoeda(subtotal);
    }
    
    // Recalcula o total geral
    calcularCustoTotalGeral();
    salvarListaPrecificacao();
}

/**
 * Atualiza o nome do produto no resumo.
 */
function atualizarNomeProdutoResumo() {
    const inputNomeProduto = document.getElementById('nomeProduto');
    const displayNomeProduto = document.getElementById('resumoNomeProduto');
    
    if (inputNomeProduto && displayNomeProduto) {
        const nome = inputNomeProduto.value.trim();
        displayNomeProduto.textContent = `Produto: ${nome || 'Não Informado'}`;
    }
    
    salvarListaPrecificacao();
}

/**
 * Calcula e exibe os totais por categoria, Mão de Obra e o Custo Total Geral.
 */
function calcularCustoTotalGeral() {
    const totalIngredientes = listaPrecificacao.ingredientes.reduce((sum, item) => sum + item.valorTotalCompra, 0); 
    const totalContas = listaPrecificacao.contas.reduce((sum, item) => sum + item.total, 0);
    const totalItens = listaPrecificacao.itens.reduce((sum, item) => sum + item.total, 0);

    const subtotalDireto = totalIngredientes + totalContas + totalItens;

    // ==========================================================
    // 🚨 ATUALIZAÇÃO: NOVA REGRA DE MÃO DE OBRA (50% do Subtotal Direto)
    // ==========================================================
    const inputMaoDeObra = document.getElementById('inputMaoDeObra');
    
    // Valor da Mão de Obra é 50% do Subtotal de Custos Diretos
    const valorMaoDeObra = subtotalDireto * 0.50; 
    
    if (inputMaoDeObra) {
        // 1. Atualiza o input/display da Mão de Obra (agora é automático)
        inputMaoDeObra.value = formatarTotalMoeda(valorMaoDeObra).replace('R$', '').trim();
        
        // 2. Remove o listener 'input' antigo, pois o campo agora é AUTOMÁTICO e deve ser readonly
        //    (Não se deve permitir edição de um campo que é calculado por regra)
        
        // 3. Atualiza o display no Resumo
        const maoDeObraCell = document.getElementById('maoDeObraValorDisplay');
        if (maoDeObraCell) {
            maoDeObraCell.textContent = formatarTotalMoeda(valorMaoDeObra);
        }
    }

    const custoGeral = subtotalDireto + valorMaoDeObra;

    // Atualiza os displays do Resumo
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
    
    // Salva o estado após o cálculo (o valor da Mão de Obra estará atualizado)
    salvarListaPrecificacao();
}


// =================================================================
// GESTÃO DO DOM E RENDERIZAÇÃO
// =================================================================

/**
 * Cria o elemento <select> para um item, com base nos dados brutos.
 */
function criarSeletorItem(categoria, selectedValue, onchangeHandler) {
    const selectElement = document.createElement('select');
    selectElement.className = 'item-select'; 
    
    if (onchangeHandler) {
        selectElement.onchange = onchangeHandler;
    }
    
    const dados = dadosBrutos[categoria]; 
    
    selectElement.innerHTML = `<option value="">--- Selecione um Item ---</option>`; 
    
    if (dados.length === 0) {
        selectElement.innerHTML = `<option value="">⚠️ Cadastre Itens na Calculadora</option>`;
        selectElement.disabled = true;
    } else {
        dados.forEach(item => {
            const option = document.createElement('option');
            option.value = item.nome;
            
            let custoDisplay;
            let labelCusto;
            
            if (categoria === 'ingredientes') {
                // Usamos item.valor que é o Valor Pago (Custo Total de Compra)
                custoDisplay = formatarTotalMoeda(item.valor); 
                labelCusto = 'Custo Total';
            } else if (categoria === 'contas') {
                custoDisplay = formatarMoedaExibicao(item.custoPorHora);
                labelCusto = 'Custo/Hora';
            } else if (categoria === 'itens') {
                custoDisplay = formatarMoedaExibicao(item.precoPorUnidade);
                labelCusto = 'Custo/Unid.';
            }

            option.textContent = `${item.nome} (${labelCusto}: ${custoDisplay})`; 
            selectElement.appendChild(option);
        });
    }

    if (selectedValue) {
        selectElement.value = selectedValue;
    }

    return selectElement;
}


/**
 * Renderiza as tabelas de Contas e Itens (com seletor permanente no final)
 */
function renderizarTabelaUnitario(categoria) {
    const lista = listaPrecificacao[categoria];
    const tbody = document.getElementById(`lista${categoria.charAt(0).toUpperCase() + categoria.slice(1)}Body`);
    
    if (!tbody) return; 

    tbody.innerHTML = '';
    
    lista.forEach((item, index) => {
        const row = tbody.insertRow();
        row.id = `item-${categoria}-${index}`; 
        
        // 1. Célula do Seletor/Nome
        const selectCell = row.insertCell();
        
        const updateHandler = () => {
            const selectElement = row.querySelector('select');
            const novoNome = selectElement.value;
            
            if (!novoNome) {
                removerLinha(categoria, index); 
                return;
            }

            const novoCusto = encontrarCusto(categoria, novoNome);
            
            // Atualiza o estado interno da lista
            listaPrecificacao[categoria][index].nome = novoNome;
            listaPrecificacao[categoria][index].custoUnitario = novoCusto;
            
            // Atualiza o Custo Unitário na tela
            row.querySelector(`td:nth-child(2)`).textContent = formatarMoedaExibicao(novoCusto);
            
            // Dispara o evento 'input' no campo de quantidade para recalcular o total da linha
            const inputQtd = row.querySelector('input[type="number"]');
            if(inputQtd) inputQtd.dispatchEvent(new Event('input'));
        };
        
        const selectElement = criarSeletorItem(categoria, item.nome, updateHandler);
        selectCell.appendChild(selectElement);
        
        // 2. Célula Custo Unitário
        row.insertCell().textContent = formatarMoedaExibicao(item.custoUnitario);
        
        // 3. Célula Quantidade Usada (Input)
        const cellQuantidade = row.insertCell();
        const inputQuantidade = document.createElement('input');
        inputQuantidade.type = 'number';
        inputQuantidade.min = '0';
        inputQuantidade.step = 'any'; 
        inputQuantidade.value = item.quantidadeUsada;
        
        inputQuantidade.oninput = () => {
             inputQuantidade.value = parseFloat(inputQuantidade.value) < 0 ? 0 : inputQuantidade.value;
             calcularTotais(categoria);
        };
        cellQuantidade.appendChild(inputQuantidade);
        
        // 4. Célula Total (será atualizada por calcularTotais)
        row.insertCell().textContent = formatarTotalMoeda(item.total);

        // 5. Célula Ações
        const acoesCell = row.insertCell();
        const btnRemover = document.createElement('button');
        btnRemover.textContent = '❌'; 
        btnRemover.classList.add('btn-remover');
        btnRemover.onclick = () => removerLinha(categoria, index);
        acoesCell.appendChild(btnRemover);
    });
    
    // Adiciona o seletor permanente no final (para Contas e Itens)
    const rowSelecao = tbody.insertRow();
    rowSelecao.classList.add('row-selecao-permanente'); 
    rowSelecao.id = `seletor-permanente-${categoria}`;

    const cellNome = rowSelecao.insertCell();
    const addHandler = () => adicionarItemSelecionado(selectElementPermanente, categoria);
    const selectElementPermanente = criarSeletorItem(categoria, "", addHandler);
    selectElementPermanente.style.fontWeight = 'bold';
    cellNome.appendChild(selectElementPermanente);
    
    // Preenche as células vazias
    rowSelecao.insertCell().textContent = ''; 
    rowSelecao.insertCell().textContent = ''; 
    rowSelecao.insertCell().textContent = ''; 
    rowSelecao.insertCell().textContent = ''; 
    
    renderizarFooter(categoria);
    calcularTotais(categoria);
}


/**
 * Função para renderizar a tabela de Ingredientes (modelo simplificado e SEM seletor permanente)
 */
function renderizarTabelaIngredientes() {
    const lista = listaPrecificacao.ingredientes;
    const tbody = document.getElementById('listaIngredientesBody');
    
    if (!tbody) return; 

    tbody.innerHTML = '';
    
    lista.forEach((item, index) => {
        const row = tbody.insertRow();
        row.id = `item-ingredientes-${index}`; 
        
        // 1. Célula do Nome (Ingrediente)
        row.insertCell().textContent = item.nome;
        
        // 2. Célula Valor Total de Compra (Valor Pago)
        row.insertCell().textContent = formatarTotalMoeda(item.valorTotalCompra); 

        // 3. Célula Ações
        const acoesCell = row.insertCell();
        const btnRemover = document.createElement('button');
        btnRemover.textContent = '❌'; 
        btnRemover.classList.add('btn-remover');
        btnRemover.onclick = () => removerLinha('ingredientes', index);
        acoesCell.appendChild(btnRemover);
    });
    
    // Linha de instrução para Ingredientes
    const rowInstrucao = tbody.insertRow();
    rowInstrucao.classList.add('row-selecao-permanente'); 
    rowInstrucao.innerHTML = `<td colspan="3" style="text-align: center; padding: 10px; color: #555;">Use o botão 'Adicionar Ingrediente' acima para incluir itens.</td>`;
    
    renderizarFooter('ingredientes');
    calcularTotais('ingredientes');
}

/**
 * Funções de renderização de Tabela unificadas.
 */
function renderizarTabela(categoria) {
    if (categoria === 'ingredientes') {
        renderizarTabelaIngredientes();
        return;
    }
    renderizarTabelaUnitario(categoria);
}


function renderizarFooter(categoria) {
    const tfoot = document.getElementById(`rodape${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`);
    
    if (!tfoot) return;

    tfoot.innerHTML = ''; 
    
    // O colspan é 2 para Ingredientes (Nome, Valor) e 4 para Contas/Itens
    const colspanValue = categoria === 'ingredientes' ? 2 : 4; 

    const rowSubtotal = tfoot.insertRow();
    rowSubtotal.innerHTML = `
        <td colspan="${colspanValue}" style="text-align: right; border-top: 2px solid #333; padding-right: 10px;"><strong>SUBTOTAL ${categoria.toUpperCase()}:</strong></td>
        <td id="subtotal${categoria.charAt(0).toUpperCase() + categoria.slice(1)}" style="border-top: 2px solid #333; font-weight: bold;">${formatarTotalMoeda(0)}</td>
    `;
}


// =================================================================
// FUNÇÕES DE INTERAÇÃO (REMOVER E MODAL)
// =================================================================

function removerLinha(categoria, index) {
    if (confirm(`Tem certeza que deseja remover este item de ${categoria}?`)) {
        listaPrecificacao[categoria].splice(index, 1);
        
        renderizarTabela(categoria);
        
        calcularCustoTotalGeral();
        salvarListaPrecificacao();
    }
}

/**
 * Cria e exibe um modal para seleção de Ingredientes.
 */
function criarModalSelecao(categoria) {
    
    const dados = dadosBrutos[categoria]; 
    if (dados.length === 0) {
        alert("Nenhum item de custo encontrado. Por favor, cadastre ingredientes na tela 'Calculadora de Custos' primeiro.");
        return;
    }

    const modalId = `modal-${categoria}`;
    let modal = document.getElementById(modalId);

    if (!modal) {
        // 1. Cria o elemento modal se ele não existir
        modal = document.createElement('div');
        modal.id = modalId;
        modal.classList.add('modal-overlay'); 
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button" onclick="document.getElementById('${modalId}').style.display='none';">&times;</span>
                <h3>Selecionar ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h3>
                <p>Selecione um ingrediente da sua lista (Nome e Valor Pago) para incluir na sua receita.</p>
                <select id="seletor-modal-${categoria}"></select>
                <button id="btn-adicionar-modal-${categoria}" class="btn-adicionar" style="margin-top: 15px;">Adicionar Selecionado</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // 2. Preenche o seletor do modal com os dados
    const selectElement = modal.querySelector(`#seletor-modal-${categoria}`);
    selectElement.innerHTML = `<option value="">--- Selecione um Item ---</option>`; 
    
    dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nome;
        
        // Puxa o Ingrediente (item.nome) e o Valor Pago (item.valor)
        const custoDisplay = formatarTotalMoeda(item.valor); 
        option.textContent = `${item.nome} (Valor Pago: ${custoDisplay})`; 
        
        selectElement.appendChild(option);
    });

    // 3. Adiciona o listener para o botão de adicionar do modal
    const btnAdicionar = modal.querySelector(`#btn-adicionar-modal-${categoria}`);
    btnAdicionar.onclick = () => {
        adicionarItemSelecionado(selectElement, categoria);
        modal.style.display = 'none'; // Fecha o modal após adicionar
    };

    // 4. Exibe o modal
    modal.style.display = 'flex'; // Mudado para 'flex' para melhor centralização com CSS
}

/**
 * Função que aciona a impressão da página, usando o CSS @media print
 * para formatar o relatório.
 */
function exportarParaPdf() {
    atualizarNomeProdutoResumo();
    calcularCustoTotalGeral();
    window.print();
}


// =================================================================
// INICIALIZAÇÃO DA PÁGINA
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa (carrega dados brutos da calculadora.js e o estado salvo da precificação)
    inicializarDados();
    
    // 2. Renderiza as tabelas com o estado carregado ou vazio
    renderizarTabela('ingredientes'); 
    renderizarTabela('contas');
    renderizarTabela('itens');
    
    // 3. Listener para o campo de nome do produto
    const inputNomeProduto = document.getElementById('nomeProduto');
    if (inputNomeProduto) {
        inputNomeProduto.addEventListener('input', atualizarNomeProdutoResumo); 
    }
    
    // 4. Listener para o botão de exportar PDF
    const btnPdf = document.getElementById('exportarPdfBtn');
    if (btnPdf) {
        btnPdf.addEventListener('click', exportarParaPdf);
    }
    
    // 5. Listener para o botão de abrir o modal de seleção de Ingredientes
    const btnAbrirIngredientes = document.getElementById('abrirSelecaoIngrediente');
    if (btnAbrirIngredientes) {
        btnAbrirIngredientes.addEventListener('click', (event) => {
             event.preventDefault(); 
             // Abre o modal de seleção para a categoria 'ingredientes'
             criarModalSelecao('ingredientes');
        });
    }

    // 6. Atualiza o resumo final (usa o estado carregado)
    atualizarNomeProdutoResumo();
    calcularCustoTotalGeral();
    
    // 7. Garante que o input de Mão de Obra não possa ser editado, já que é calculado
    const inputMaoDeObra = document.getElementById('inputMaoDeObra');
    if (inputMaoDeObra) {
        inputMaoDeObra.readOnly = true; 
        // Remove qualquer listener que possa ter sido adicionado anteriormente, pois não é mais manual.
        inputMaoDeObra.removeEventListener('input', calcularCustoTotalGeral); 
    }
});
