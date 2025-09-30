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
    // Mantém a precisão de 2 a 4 casas decimais
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

// =================================================================
// VARIÁVEIS GLOBAIS E PERSISTÊNCIA (LOCALSTORAGE)
// =================================================================

let ingredientes = [];
let contas = []; 
let itensEmbalagem = []; 

const INGREDIENTES_KEY = 'ingredientesCalculados';
const CONTAS_KEY = 'contasFixasCalculadas'; 
const ITENS_KEY = 'itensEmbalagemCalculados'; 

/**
 * Salva todos os arrays no localStorage.
 */
function salvarDados() {
    localStorage.setItem(INGREDIENTES_KEY, JSON.stringify(ingredientes));
    localStorage.setItem(CONTAS_KEY, JSON.stringify(contas)); 
    localStorage.setItem(ITENS_KEY, JSON.stringify(itensEmbalagem)); 
}

/**
 * Carrega todos os arrays do localStorage.
 */
function carregarDados() {
    const ingredientesSalvos = localStorage.getItem(INGREDIENTES_KEY);
    const contasSalvas = localStorage.getItem(CONTAS_KEY); 
    const itensSalvos = localStorage.getItem(ITENS_KEY); 

    if (ingredientesSalvos) {
        ingredientes = JSON.parse(ingredientesSalvos);
    }
    if (contasSalvas) {
        contas = JSON.parse(contasSalvas); 
    }
    if (itensSalvos) {
        itensEmbalagem = JSON.parse(itensSalvos); 
    }
}

// =================================================================
// LÓGICA PRINCIPAL E MANIPULAÇÃO DO DOM
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da Calculadora de Ingredientes
    const formIngrediente = document.getElementById('formAdicionarIngrediente');
    const listaIngredientes = document.getElementById('listaIngredientes');
    const btnLimparIngredientes = document.getElementById('btnLimparIngredientes');

    // Elementos da Calculadora de Contas
    const formConta = document.getElementById('formAdicionarConta');
    const listaContas = document.getElementById('listaContas');
    const btnLimparContas = document.getElementById('btnLimparContas');

    // Elementos da Calculadora de Itens
    const formItem = document.getElementById('formAdicionarItem');
    const listaItens = document.getElementById('listaItens');
    const btnLimparItens = document.getElementById('btnLimparItens');


    // Carrega os dados salvos ao iniciar a página
    carregarDados();
    renderizarTabelaIngredientes();
    renderizarTabelaContas(); 
    renderizarTabelaItens(); 

    // =================================================================
    // FUNÇÕES DE CÁLCULO (CONTAS) - Permanecem as mesmas
    // =================================================================
    
    const DIAS_MES = 30;
    const HORAS_DIA = 8; 
    const HORAS_MES = DIAS_MES * HORAS_DIA; // 240 horas de trabalho/produção

    function calcularCustoPorHora(valorMensal) {
        const valorNumerico = parseFloat(removeMascara(valorMensal));
        
        if (isNaN(valorNumerico) || valorNumerico <= 0) return 0;
        
        return valorNumerico / HORAS_MES; 
    }

    // =================================================================
    // FUNÇÕES DE CÁLCULO (ITENS) - Permanecem as mesmas
    // =================================================================
    
    function calcularPrecoPorUnidade(precoTotal, quantidade) {
        const precoNumerico = parseFloat(removeMascara(precoTotal));
        
        if (isNaN(precoNumerico) || precoNumerico <= 0) return 0;
        if (isNaN(quantidade) || quantidade <= 0) return 0;
        
        // Preço por Unidade = Preço do Pacote / Quantidade no Pacote
        return precoNumerico / quantidade; 
    }

    // =================================================================
    // MANIPULAÇÃO DO FORMULÁRIO (INGREDIENTES) - MODIFICADA
    // =================================================================

    formIngrediente.addEventListener('submit', function(event) {
        event.preventDefault();

        const ingredienteNome = document.getElementById('ingredienteNome').value;
        const valorPagoInput = document.getElementById('valorPago');
        const valorPago = valorPagoInput.value;
        const localCompra = document.getElementById('localCompra').value;

        // Se o ingrediente ou valor não foram preenchidos
        if (!ingredienteNome.trim() || !valorPago.trim()) {
            alert("Por favor, preencha o nome do ingrediente e o valor pago.");
            return;
        }

        const novoIngrediente = {
            nome: ingredienteNome,
            // Armazenamos o valor numérico para consistência
            valor: parseFloat(removeMascara(valorPago)),
            local: localCompra || 'N/A'
        };

        ingredientes.push(novoIngrediente);
        salvarDados();
        renderizarTabelaIngredientes();
        formIngrediente.reset();
        valorPagoInput.value = ''; 
    });

    // =================================================================
    // MANIPULAÇÃO DO FORMULÁRIO (CONTAS) - Permanece a mesma
    // =================================================================

    formConta.addEventListener('submit', function(event) {
        event.preventDefault();

        const nomeConta = document.getElementById('nomeConta').value;
        const valorContaInput = document.getElementById('valorConta');
        const valorConta = valorContaInput.value;

        const valorMensal = parseFloat(removeMascara(valorConta));

        if (isNaN(valorMensal) || valorMensal <= 0) {
            alert("Por favor, informe um valor mensal válido para a conta.");
            return;
        }
        
        const custoPorHora = calcularCustoPorHora(valorConta); 

        const novaConta = {
            nome: nomeConta,
            valor: valorMensal,
            custoPorHora: custoPorHora,
        };

        contas.push(novaConta);
        salvarDados();
        renderizarTabelaContas();
        formConta.reset();
        valorContaInput.value = ''; 
    });

    // =================================================================
    // MANIPULAÇÃO DO FORMULÁRIO (ITENS) - Permanece a mesma
    // =================================================================
    
    formItem.addEventListener('submit', function(event) {
        event.preventDefault();

        const nomeItem = document.getElementById('nomeItem').value;
        const precoItemInput = document.getElementById('precoItem');
        const precoItem = precoItemInput.value;
        const quantidadeItem = parseFloat(document.getElementById('quantidadeItem').value);

        if (isNaN(quantidadeItem) || quantidadeItem <= 0 || !nomeItem) {
            alert("Por favor, preencha o nome do item e a quantidade no pacote.");
            return;
        }
        
        const precoPorUnidade = calcularPrecoPorUnidade(precoItem, quantidadeItem);

        const novoItem = {
            nome: nomeItem,
            precoTotal: parseFloat(removeMascara(precoItem)),
            quantidade: quantidadeItem,
            precoPorUnidade: precoPorUnidade,
        };

        itensEmbalagem.push(novoItem);
        salvarDados();
        renderizarTabelaItens();
        formItem.reset();
        precoItemInput.value = ''; 
    });


    // =================================================================
    // MANIPULAÇÃO DA TABELA (INGREDIENTES) - MODIFICADA
    // =================================================================

    function renderizarTabelaIngredientes() {
        listaIngredientes.innerHTML = '';

        ingredientes.forEach((item, index) => {
            const row = listaIngredientes.insertRow();
            
            // Colunas: Ingrediente, Valor Pago, Local da Compra, Ações
            row.insertCell().textContent = item.nome;
            row.insertCell().textContent = formatarMoedaExibicao(item.valor); 
            row.insertCell().textContent = item.local;

            const acoesCell = row.insertCell();
            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-remover');
            btnRemover.onclick = () => removerIngrediente(index);
            acoesCell.appendChild(btnRemover);
        });
    }

    function removerIngrediente(index) {
        if (confirm('Tem certeza que deseja remover este ingrediente?')) {
            ingredientes.splice(index, 1);
            salvarDados(); 
            renderizarTabelaIngredientes();
        }
    }
    
    function limparTabelaIngredientes() {
        if (confirm('Tem certeza que deseja limpar TODOS os ingredientes da lista?')) {
            ingredientes = [];
            salvarDados(); 
            renderizarTabelaIngredientes();
        }
    }

    btnLimparIngredientes.addEventListener('click', limparTabelaIngredientes);

    // =================================================================
    // MANIPULAÇÃO DA TABELA (CONTAS) - Permanece a mesma
    // =================================================================
    
    function renderizarTabelaContas() {
        listaContas.innerHTML = '';
        
        contas.forEach((item, index) => {
            const row = listaContas.insertRow();
            
            row.insertCell().textContent = item.nome;
            row.insertCell().textContent = formatarMoedaExibicao(item.valor);
            row.insertCell().textContent = formatarMoedaExibicao(item.custoPorHora); 
            
            const acoesCell = row.insertCell();
            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-remover');
            btnRemover.onclick = () => removerConta(index);
            acoesCell.appendChild(btnRemover);
        });
    }

    function removerConta(index) {
        if (confirm('Tem certeza que deseja remover esta conta?')) {
            contas.splice(index, 1);
            salvarDados(); 
            renderizarTabelaContas();
        }
    }

    function limparTabelaContas() {
        if (confirm('Tem certeza que deseja limpar TODAS as contas da lista?')) {
            contas = [];
            salvarDados(); 
            renderizarTabelaContas();
        }
    }

    btnLimparContas.addEventListener('click', limparTabelaContas);

    // =================================================================
    // MANIPULAÇÃO DA TABELA (ITENS) - Permanece a mesma
    // =================================================================
    
    function renderizarTabelaItens() {
        listaItens.innerHTML = '';
        
        itensEmbalagem.forEach((item, index) => {
            const row = listaItens.insertRow();
            
            row.insertCell().textContent = item.nome;
            row.insertCell().textContent = formatarMoedaExibicao(item.precoTotal);
            row.insertCell().textContent = item.quantidade;
            // Preço por Unidade
            row.insertCell().textContent = formatarMoedaExibicao(item.precoPorUnidade); 
            
            const acoesCell = row.insertCell();
            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-remover');
            btnRemover.onclick = () => removerItem(index);
            acoesCell.appendChild(btnRemover);
        });
    }

    function removerItem(index) {
        if (confirm('Tem certeza que deseja remover este item de embalagem?')) {
            itensEmbalagem.splice(index, 1);
            salvarDados(); 
            renderizarTabelaItens();
        }
    }

    function limparTabelaItens() {
        if (confirm('Tem certeza que deseja limpar TODOS os itens de embalagem da lista?')) {
            itensEmbalagem = [];
            salvarDados(); 
            renderizarTabelaItens();
        }
    }

    btnLimparItens.addEventListener('click', limparTabelaItens);
});
