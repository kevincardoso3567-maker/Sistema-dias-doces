// =================================================================
// FUNÇÕES DE MÁSCARA E AUXILIARES
// =================================================================

const MESES_NOMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function removeMascara(valor) {
    // Remove "R$", espaços, pontos de milhar, e troca a vírgula decimal por ponto
    return valor.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
}

const formatarMoedaExibicao = (valor) => {
    // Formata o valor para exibição em moeda brasileira com 2 casas decimais
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// =================================================================
// VARIÁVEIS GLOBAIS E PERSISTÊNCIA (LOCALSTORAGE)
// =================================================================

let vendas = [];
const VENDAS_KEY = 'registrosEstoque'; // CHAVE CORRETA

function salvarVendas() {
    localStorage.setItem(VENDAS_KEY, JSON.stringify(vendas));
}

function carregarDados() {
    const vendasSalvas = localStorage.getItem(VENDAS_KEY);

    if (vendasSalvas) {
        vendas = JSON.parse(vendasSalvas);
    }
}

// =================================================================
// LÓGICA PRINCIPAL E MANIPULAÇÃO DO DOM
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const formAdicionarVenda = document.getElementById('formAdicionarVenda');
    const listaVendas = document.getElementById('listaVendas');
    
    // CAMPOS DE ENTRADA DE VENDAS
    const vendaClienteInput = document.getElementById('vendaCliente'); 
    const vendaDataInput = document.getElementById('vendaData');
    const vendaMesSelect = document.getElementById('vendaMes');
    const vendaPrecoUnitarioInput = document.getElementById('vendaPrecoUnitario');
    const vendaQuantidadeInput = document.getElementById('vendaQuantidade');
    const vendaPrecoFinalInput = document.getElementById('vendaPrecoFinal');
    const btnLimparVendas = document.getElementById('btnLimparVendas');
    const vendaPagamentoSelect = document.getElementById('vendaPagamento');
    const vendaStatusSelect = document.getElementById('vendaStatus');
    const rankingLista = document.getElementById('rankingLista');
    
    // Elementos dos Cartões de Destaque
    const mesMaisVendeuNome = document.getElementById('mesMaisVendeuNome');
    const mesMaisVendeuValor = document.getElementById('mesMaisVendeuValor');
    const pagamentoMaisUsadoNome = document.getElementById('pagamentoMaisUsadoNome');
    const pagamentoMaisUsadoContagem = document.getElementById('pagamentoMaisUsadoContagem');
    
    // ELEMENTO DA TABELA DE FATURAMENTO MENSAL
    const listaFaturamentoMensal = document.getElementById('listaFaturamentoMensal');
    
    carregarDados();
    renderizarTabelaVendas();
    renderizarRanking();
    renderizarMesMaisVendedor();
    renderizarMetodoPagamentoMaisUsado();
    renderizarTabelaTotalMensal(); 
    
    const hoje = new Date().toISOString().split('T')[0];
    vendaDataInput.value = hoje;
    
    atualizarMesComBaseNaData();


    // --- FUNÇÕES DE LÓGICA DE DADOS ---

    function atualizarMesComBaseNaData() {
        const dataValor = vendaDataInput.value;
        if (dataValor) {
            const dataObj = new Date(dataValor + 'T00:00:00');
            const mesNumero = dataObj.getMonth() + 1;
            vendaMesSelect.value = String(mesNumero);
        } else {
            vendaMesSelect.value = "";
        }
    }

    function calcularPrecoFinal() {
        const precoUnitarioTexto = vendaPrecoUnitarioInput.value;
        const quantidade = parseFloat(vendaQuantidadeInput.value);
        
        // CORRIGIDO: Usa removeMascara para obter um número limpo
        const precoNumerico = parseFloat(removeMascara(precoUnitarioTexto));

        if (isNaN(precoNumerico) || isNaN(quantidade) || quantidade <= 0) {
            vendaPrecoFinalInput.value = 'Cálculo Inválido';
            return 0;
        }

        const precoFinal = precoNumerico * quantidade;
        
        vendaPrecoFinalInput.value = formatarMoedaExibicao(precoFinal);
        return precoFinal;
    }
    
    // --- EVENT LISTENERS ---
    
    vendaDataInput.addEventListener('change', atualizarMesComBaseNaData); 
    
    vendaQuantidadeInput.addEventListener('input', calcularPrecoFinal);
    
    vendaPrecoUnitarioInput.addEventListener('blur', function() {
        let valor = vendaPrecoUnitarioInput.value.trim();
        const valorNumerico = parseFloat(removeMascara(valor));

        if (!valor || isNaN(valorNumerico)) {
            vendaPrecoUnitarioInput.value = formatarMoedaExibicao(0);
        } else {
            vendaPrecoUnitarioInput.value = formatarMoedaExibicao(valorNumerico);
        }
        
        calcularPrecoFinal();
    });

    formAdicionarVenda.addEventListener('submit', function(event) {
        event.preventDefault();

        if (vendaClienteInput.value.trim() === "") {
            alert("Por favor, preencha a Descrição do Item.");
            return;
        }
        if (vendaStatusSelect.value === "") {
            alert("Por favor, selecione o Status (Entrada/Saída).");
            return;
        }
        
        vendaPrecoUnitarioInput.dispatchEvent(new Event('blur'));

        const precoFinal = calcularPrecoFinal();
        // CORRIGIDO: Usa removeMascara no valor do campo para garantir que o número salvo seja limpo
        const precoUnitarioNumerico = parseFloat(removeMascara(vendaPrecoUnitarioInput.value));
        const precoFinalNumerico = precoFinal; 
        
        if (isNaN(precoFinalNumerico) || precoFinalNumerico < 0 || isNaN(precoUnitarioNumerico) || precoUnitarioNumerico < 0) {
            alert("Preço final/unitário inválido. Verifique o preço e a quantidade.");
            return;
        }

        const descricaoItem = vendaClienteInput.value.trim();

        const novaVenda = {
            data: vendaDataInput.value,
            mes: vendaMesSelect.value,
            status: vendaStatusSelect.value,
            cliente: descricaoItem, 
            produto: descricaoItem, 
            id: 'N/A', 
            // ESSENCIAL: Salva como número, NÃO como string de moeda
            precoUnitario: precoUnitarioNumerico,
            quantidade: parseFloat(vendaQuantidadeInput.value),
            precoFinal: precoFinalNumerico, // ESSENCIAL: Salva como número
            metodoPagamento: vendaPagamentoSelect.value
        };

        vendas.push(novaVenda);
        salvarVendas();
        renderizarTabelaVendas();
        renderizarRanking();
        renderizarMesMaisVendedor();
        renderizarMetodoPagamentoMaisUsado();
        renderizarTabelaTotalMensal(); 
        
        formAdicionarVenda.reset();
        
        // Reset manual
        vendaDataInput.value = hoje;
        atualizarMesComBaseNaData();
        
        vendaPrecoUnitarioInput.value = '';
        vendaPrecoFinalInput.value = '';
        vendaQuantidadeInput.value = 1;
    });


    // --- LÓGICA DA TABELA DE RESUMO MENSAL (SAÍDAS) ---

    function calcularTotalMensal() {
        const totalPorMes = {};
        
        for(let i = 1; i <= 12; i++) {
            totalPorMes[i] = 0.00;
        }

        vendas.forEach(venda => {
            if (venda.status === 'saida') { // Foca apenas em SAÍDAS
                const mesNumero = parseInt(venda.mes);
                const valor = venda.precoFinal; // É um número

                if (totalPorMes.hasOwnProperty(mesNumero)) {
                    totalPorMes[mesNumero] += valor;
                }
            }
        });
        
        return totalPorMes;
    }
    
    function renderizarTabelaTotalMensal() {
        const totalDados = calcularTotalMensal();
        listaFaturamentoMensal.innerHTML = '';
        
        const mesMaisCustoNome = document.getElementById('mesMaisVendeuNome').textContent; 
        
        for (let i = 1; i <= 12; i++) {
            const row = listaFaturamentoMensal.insertRow();
            const mesNome = MESES_NOMES[i - 1];
            const total = totalDados[i] || 0.00;

            row.insertCell(0).textContent = mesNome;
            
            const totalCell = row.insertCell(1);
            totalCell.textContent = formatarMoedaExibicao(total);
            totalCell.style.textAlign = 'right';
            
            if (mesNome === mesMaisCustoNome && total > 0) {
                row.style.backgroundColor = '#ffe0e0'; 
                totalCell.style.fontWeight = 'bold';
            }
        }
    }


    // --- LÓGICA DOS CARTÕES DE DESTAQUE (SAÍDAS) ---

    function calcularMesMaisVendedor() {
        const custoPorMes = {};
        let mesMaisCusto = null;
        let maiorCusto = 0;

        vendas.forEach(venda => {
            if (venda.status === 'saida') { // Foca em SAÍDA
                const mesNumero = parseInt(venda.mes);
                const custo = venda.precoFinal; 

                if (!custoPorMes[mesNumero]) {
                    custoPorMes[mesNumero] = 0;
                }
                
                custoPorMes[mesNumero] += custo;
            }
        });

        for (const mesNumero in custoPorMes) {
            const total = custoPorMes[mesNumero];
            
            if (total > maiorCusto) {
                maiorCusto = total;
                mesMaisCusto = MESES_NOMES[parseInt(mesNumero) - 1]; 
            }
        }

        return { 
            nome: mesMaisCusto, 
            valor: maiorCusto 
        };
    }

    function renderizarMesMaisVendedor() {
        const resultado = calcularMesMaisVendedor();
        const cardTitle = document.querySelector('#mesMaisVendeuCard h3');

        if (cardTitle) {
            cardTitle.textContent = 'Mês de Maior Custo (Saída)';
        }
        
        if (resultado.nome) {
            mesMaisVendeuNome.textContent = resultado.nome;
            mesMaisVendeuValor.textContent = `Total: ${formatarMoedaExibicao(resultado.valor)}`;
        } else {
            mesMaisVendeuNome.textContent = 'N/A';
            mesMaisVendeuValor.textContent = 'Total: R$ 0,00';
        }
    }

    function calcularMetodoPagamentoMaisUsado() {
        const contagemPorMetodo = {};
        let metodoMaisUsado = null;
        let maiorContagem = 0;

        vendas.forEach(venda => {
            if (venda.status === 'saida') { // Foca em SAÍDA
                const metodo = venda.metodoPagamento;
                
                if (!contagemPorMetodo[metodo]) {
                    contagemPorMetodo[metodo] = 0;
                }
                
                contagemPorMetodo[metodo]++;
            }
        });

        for (const metodo in contagemPorMetodo) {
            const contagem = contagemPorMetodo[metodo];
            
            if (contagem > maiorContagem) {
                maiorContagem = contagem;
                metodoMaisUsado = metodo;
            }
        }

        const nomeFormatado = metodoMaisUsado 
            ? metodoMaisUsado.charAt(0).toUpperCase() + metodoMaisUsado.slice(1)
            : null;

        return { 
            nome: nomeFormatado, 
            contagem: maiorContagem 
        };
    }

    function renderizarMetodoPagamentoMaisUsado() {
        const resultado = calcularMetodoPagamentoMaisUsado();
        const cardTitle = document.querySelector('#pagamentoMaisUsadoCard h3');
        
        if (cardTitle) {
            cardTitle.textContent = 'Método de Pagamento Principal (Saída)';
        }

        if (resultado.nome) {
            pagamentoMaisUsadoNome.textContent = resultado.nome;
            pagamentoMaisUsadoContagem.textContent = `${resultado.contagem} transações`;
        } else {
            pagamentoMaisUsadoNome.textContent = 'N/A';
            pagamentoMaisUsadoContagem.textContent = '0 transações';
        }
    }

    function calcularRanking() {
        const ranking = {};

        vendas.forEach(venda => {
            if (venda.status === 'entrada') { 
                const nome = venda.produto; 
                const quantidade = venda.quantidade;
                
                if (ranking[nome]) {
                    ranking[nome] += quantidade;
                } else {
                    ranking[nome] = quantidade;
                }
            }
        });

        const rankingArray = Object.entries(ranking);
        rankingArray.sort((a, b) => b[1] - a[1]);

        return rankingArray;
    }

    function renderizarRanking() {
        const rankingDados = calcularRanking();
        rankingLista.innerHTML = ''; 

        if (rankingDados.length === 0) {
            rankingLista.innerHTML = '<li>Nenhum dado de registro para calcular o resumo.</li>';
            return;
        }

        rankingDados.forEach(([produto, totalQuantidade], index) => {
            const li = document.createElement('li');
            
            const rankNumber = index + 1;
            
            const tituloSpan = document.createElement('span');
            tituloSpan.classList.add('ranking-titulo');
            tituloSpan.textContent = `${rankNumber}. ${produto}`; 
            
            const subtituloSpan = document.createElement('span');
            subtituloSpan.classList.add('ranking-subtitulo');
            subtituloSpan.textContent = `Total de unidades registradas: ${totalQuantidade}`;

            li.appendChild(tituloSpan);
            li.appendChild(subtituloSpan);

            if (index === 0) {
                li.classList.add('ranking-gold');
            } else if (index === 1) {
                li.classList.add('ranking-silver');
            } else if (index === 2) {
                li.classList.add('ranking-bronze');
            }

            rankingLista.appendChild(li);
        });
    }

    // --- MANIPULAÇÃO DA TABELA PRINCIPAL DE VENDAS ---

    function renderizarTabelaVendas() {
        listaVendas.innerHTML = '';

        vendas.forEach((item, index) => {
            const row = listaVendas.insertRow();
            
            const mesNome = MESES_NOMES[parseInt(item.mes) - 1] || 'N/A';
            
            const statusDiv = document.createElement('span');
            statusDiv.textContent = item.status.charAt(0).toUpperCase() + item.status.slice(1);
            if (item.status === 'entrada') {
                statusDiv.classList.add('status-entrada');
            } else if (item.status === 'saida') {
                statusDiv.classList.add('status-saida');
            }
            
            let i = 0;
            row.insertCell(i++).textContent = item.data;
            row.insertCell(i++).textContent = mesNome;
            row.insertCell(i++).appendChild(statusDiv); 
            row.insertCell(i++).textContent = item.cliente; 
            row.insertCell(i++).textContent = formatarMoedaExibicao(item.precoUnitario);
            row.insertCell(i++).textContent = item.quantidade;
            row.insertCell(i++).textContent = formatarMoedaExibicao(item.precoFinal);
            
            let pagamentoNome = item.metodoPagamento.charAt(0).toUpperCase() + item.metodoPagamento.slice(1);
            row.insertCell(i++).textContent = pagamentoNome;

            const acoesCell = row.insertCell(i++);
            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-remover');
            btnRemover.onclick = () => removerVenda(index);
            acoesCell.appendChild(btnRemover);
        });
    }

    function removerVenda(index) {
        if (confirm('Tem certeza que deseja remover este registro?')) {
            vendas.splice(index, 1);
            salvarVendas(); 
            renderizarTabelaVendas();
            renderizarRanking();
            renderizarMesMaisVendedor(); 
            renderizarMetodoPagamentoMaisUsado();
            renderizarTabelaTotalMensal(); 
        }
    }

    function limparTabelaVendas() {
        if (confirm('Tem certeza que deseja limpar TODOS os registros? Esta ação é irreversível.')) {
            vendas = [];
            salvarVendas(); 
            renderizarTabelaVendas();
            renderizarRanking();
            renderizarMesMaisVendedor(); 
            renderizarMetodoPagamentoMaisUsado();
            renderizarTabelaTotalMensal(); 
        }
    }

    btnLimparVendas.addEventListener('click', limparTabelaVendas);
});