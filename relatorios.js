// O nome deste arquivo é relatorios.js
const VENDAS_STORAGE_KEY = 'registrosVendas';
const ESTOQUE_STORAGE_KEY = 'registrosEstoque';
const MESES_NOMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Função auxiliar para formatar valores para o formato de moeda brasileira (R$)
const formatarMoeda = (valor) => {
    const valorNumerico = parseFloat(valor) || 0; 
    return valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para obter dados salvos do LocalStorage
const obterDados = (chave) => {
    const dadosJSON = localStorage.getItem(chave);
    return dadosJSON ? JSON.parse(dadosJSON) : [];
};

// Função para obter o nome do mês a partir do número (ex: 1 -> Janeiro)
const obterNomeMes = (numeroMes) => {
    return MESES_NOMES[numeroMes - 1] || 'Mês Inválido';
};

// =========================================================================
// LÓGICA DE CÁLCULO E RENDERIZAÇÃO DE TABELAS CONSOLIDADAS
// =========================================================================

/**
 * Calcula o resumo de faturamento (Entradas) por mês para o ano todo.
 */
const calcularFaturamentoMensalAnual = () => {
    const vendas = obterDados(VENDAS_STORAGE_KEY);
    const faturamentoPorMes = {};
    
    // Inicializa todos os meses
    for(let i = 1; i <= 12; i++) {
        faturamentoPorMes[i] = 0.00;
    }

    vendas.forEach(venda => {
        const mesNumero = parseInt(venda.mes);
        const precoFinalNumerico = parseFloat(venda.precoFinal);

        if (venda.status === 'entrada' && !isNaN(precoFinalNumerico)) {
            if (faturamentoPorMes.hasOwnProperty(mesNumero)) {
                faturamentoPorMes[mesNumero] += precoFinalNumerico;
            }
        }
    });
    return faturamentoPorMes;
};

/**
 * Renderiza a tabela de Faturamento Mensal Anual (Entradas).
 */
const renderizarTabelaFaturamentoAnual = (faturamentoDados) => {
    const listaFaturamentoMensal = document.getElementById('listaFaturamentoMensal');
    if (!listaFaturamentoMensal) return; // Sai se o elemento não existir
    
    listaFaturamentoMensal.innerHTML = '';
    
    let totalAnual = 0;

    for (let i = 1; i <= 12; i++) {
        const row = listaFaturamentoMensal.insertRow();
        const mesNome = obterNomeMes(i);
        const total = faturamentoDados[i] || 0.00;
        totalAnual += total;

        row.insertCell(0).textContent = mesNome;
        
        const totalCell = row.insertCell(1);
        totalCell.textContent = formatarMoeda(total);
        totalCell.style.textAlign = 'right';
    }
    
    // Adiciona o rodapé com o total geral
    const footer = listaFaturamentoMensal.insertRow();
    footer.classList.add('total-row');
    footer.insertCell(0).textContent = 'TOTAL ANUAL (ENTRADAS)';
    
    const totalCell = footer.insertCell(1);
    totalCell.textContent = formatarMoeda(totalAnual);
    totalCell.style.textAlign = 'right';
    totalCell.style.fontWeight = 'bold';
};

/**
 * Calcula o resumo de despesas (Saídas) por mês para o ano todo.
 */
const calcularDespesasMensaisAnual = () => {
    const despesas = obterDados(ESTOQUE_STORAGE_KEY);
    const despesasPorMes = {};
    
    // Inicializa todos os meses
    for(let i = 1; i <= 12; i++) {
        despesasPorMes[i] = 0.00;
    }

    despesas.forEach(despesa => {
        const mesNumero = parseInt(despesa.mes);
        const precoFinalNumerico = parseFloat(despesa.precoFinal);

        if (despesa.status === 'saida' && !isNaN(precoFinalNumerico)) {
            if (despesasPorMes.hasOwnProperty(mesNumero)) {
                despesasPorMes[mesNumero] += precoFinalNumerico;
            }
        }
    });
    return despesasPorMes;
};

/**
 * Renderiza a tabela de Despesas Mensais Anuais (Saídas).
 */
const renderizarTabelaDespesasAnual = (despesasDados) => {
    const listaDespesasMensais = document.getElementById('listaDespesasMensais');
    if (!listaDespesasMensais) return; // Sai se o elemento não existir

    listaDespesasMensais.innerHTML = '';
    
    let totalAnual = 0;

    for (let i = 1; i <= 12; i++) {
        const row = listaDespesasMensais.insertRow();
        const mesNome = obterNomeMes(i);
        const total = despesasDados[i] || 0.00;
        totalAnual += total;

        row.insertCell(0).textContent = mesNome;
        
        const totalCell = row.insertCell(1);
        totalCell.textContent = formatarMoeda(total);
        totalCell.style.textAlign = 'right';
        totalCell.style.color = 'red'; // Destaque para despesas
    }
    
    // Adiciona o rodapé com o total geral
    const footer = listaDespesasMensais.insertRow();
    footer.classList.add('total-row');
    footer.insertCell(0).textContent = 'TOTAL ANUAL (SAÍDAS)';
    
    const totalCell = footer.insertCell(1);
    totalCell.textContent = formatarMoeda(totalAnual);
    totalCell.style.textAlign = 'right';
    totalCell.style.fontWeight = 'bold';
    totalCell.style.color = 'red'; // Destaque para despesas
};

// =========================================================================
// LÓGICA PRINCIPAL DE CÁLCULO (Por MÊS Selecionado)
// (Mantida para o Resumo Principal na Tela)
// =========================================================================

const calcularResumoMensal = (mesSelecionado) => {
    // Busca dados de todas as entradas e saídas
    const vendas = obterDados(VENDAS_STORAGE_KEY);
    const despesas = obterDados(ESTOQUE_STORAGE_KEY);

    let faturamentoTotal = 0;
    let despesaTotal = 0;

    // Faturamento (Entradas)
    vendas.forEach(venda => {
        const mesDoRegistro = parseInt(venda.mes);
        if (mesDoRegistro === mesSelecionado && venda.status === 'entrada') {
            const precoFinalNumerico = parseFloat(venda.precoFinal); 
            if (!isNaN(precoFinalNumerico)) {
                faturamentoTotal += precoFinalNumerico;
            }
        }
    });

    // Despesas (Saídas)
    despesas.forEach(despesa => {
        const mesDoRegistro = parseInt(despesa.mes);
        if (mesDoRegistro === mesSelecionado && despesa.status === 'saida') {
            const precoFinalNumerico = parseFloat(despesa.precoFinal);
            if (!isNaN(precoFinalNumerico)) {
                despesaTotal += precoFinalNumerico;
            }
        }
    });

    const saldoLiquido = faturamentoTotal - despesaTotal;

    return {
        faturamento: faturamentoTotal,
        despesas: despesaTotal,
        saldo: saldoLiquido,
        nomeMes: obterNomeMes(mesSelecionado)
    };
};

// =========================================================================
// LÓGICA DE ATUALIZAÇÃO DA INTERFACE (DOM)
// =========================================================================

// ... (Função atualizarInterface permanece inalterada) ...
const atualizarInterface = (resultados) => {
    
    const valorEntradaElement = document.getElementById('valorEntrada');
    const valorSaidaElement = document.getElementById('valorSaida');
    const valorSaldoElement = document.getElementById('valorSaldo');
    
    const mesEntradaLabel = document.getElementById('mesEntradaLabel');
    const mesSaidaLabel = document.getElementById('mesSaidaLabel');
    const mesDisplay = document.getElementById('mesSelecionadoDisplay');
    
    const nomeMes = resultados.nomeMes;

    mesDisplay.textContent = `Resumo Detalhado de ${nomeMes}`;
    mesEntradaLabel.textContent = `Entrada (Faturamento) de ${nomeMes}`;
    mesSaidaLabel.textContent = `Saída (Despesa) de ${nomeMes}`;

    valorEntradaElement.textContent = formatarMoeda(resultados.faturamento);
    valorSaidaElement.textContent = formatarMoeda(resultados.despesas);
    valorSaldoElement.textContent = formatarMoeda(resultados.saldo);
    
    if (resultados.saldo > 0) {
        valorSaldoElement.style.color = 'green';
    } else if (resultados.saldo < 0) {
        valorSaldoElement.style.color = 'red';
    } else {
        valorSaldoElement.style.color = '#333';
    }
};

// =========================================================================
// INICIALIZAÇÃO E EVENTOS
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const selectMes = document.getElementById('inputMesPesquisa');
    
    // Calcula e renderiza as tabelas anuais de faturamento e despesas
    const faturamentoAnual = calcularFaturamentoMensalAnual();
    renderizarTabelaFaturamentoAnual(faturamentoAnual);
    
    const despesasAnual = calcularDespesasMensaisAnual();
    renderizarTabelaDespesasAnual(despesasAnual);


    // --- Lógica de Inicialização do Resumo Mensal ---
    
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1; 

    if (selectMes && selectMes.options.length > 1) {
        selectMes.value = String(mesAtual);
        
        const resultadosIniciais = calcularResumoMensal(mesAtual);
        atualizarInterface(resultadosIniciais);
    }

    // --- Lógica de Evento de Mudança ---

    selectMes.addEventListener('change', (e) => {
        const mesSelecionado = parseInt(e.target.value);
        
        if (isNaN(mesSelecionado) || mesSelecionado < 1 || mesSelecionado > 12) {
            return;
        }

        const resultados = calcularResumoMensal(mesSelecionado);
        atualizarInterface(resultados);
    });
});