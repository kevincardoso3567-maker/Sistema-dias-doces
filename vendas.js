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
let produtosCadastrados = []; 
let clientesCadastrados = []; // <-- NOVO: Array para guardar clientes
const VENDAS_KEY = 'registrosVendas'; 
const PRODUTOS_KEY = 'produtosCadastrados'; 
const CLIENTES_KEY = 'clientes'; // <-- NOVO: Chave de clientes (do cadastro-de-clientes.js)

function salvarVendas() {
    localStorage.setItem(VENDAS_KEY, JSON.stringify(vendas)); 
}

function carregarDados() {
    const vendasSalvas = localStorage.getItem(VENDAS_KEY);
    const produtosSalvos = localStorage.getItem(PRODUTOS_KEY); 
    const clientesSalvos = localStorage.getItem(CLIENTES_KEY); // <-- NOVO

    if (vendasSalvas) {
        vendas = JSON.parse(vendasSalvas);
    }
    if (produtosSalvos) {
        produtosCadastrados = JSON.parse(produtosSalvos); 
    }
    // NOVO: Carrega os clientes
    if (clientesSalvos) {
        clientesCadastrados = JSON.parse(clientesSalvos); 
    }
    if (!produtosCadastrados) {
        produtosCadastrados = [];
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
    const vendaProdutoSelect = document.getElementById('vendaProduto');
    const vendaIDInput = document.getElementById('vendaID');
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
    
    // Elemento da Tabela de Faturamento Mensal
    const listaFaturamentoMensal = document.getElementById('listaFaturamentoMensal'); 
    
    carregarDados();
    preencherOpcoesProdutos();
    preencherOpcoesClientes(); // <-- NOVO: Chama o preenchimento do datalist de clientes
    renderizarTabelaVendas();
    renderizarRanking();
    renderizarMesMaisVendedor();
    renderizarMetodoPagamentoMaisUsado();
    renderizarTabelaFaturamentoMensal(); 
    
    const hoje = new Date().toISOString().split('T')[0];
    vendaDataInput.value = hoje;
    
    atualizarMesComBaseNaData(); 


    // --- FUNÇÕES DE LÓGICA DE DADOS ---
    
    // NOVO: Preenche o datalist com os nomes dos clientes cadastrados
    function preencherOpcoesClientes() {
        const datalistClientes = document.getElementById('listaClientesCadastrados');
        if (!datalistClientes) return;

        datalistClientes.innerHTML = ''; 

        if (clientesCadastrados && clientesCadastrados.length > 0) {
            clientesCadastrados.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.nome;
                datalistClientes.appendChild(option);
            });
        }
    }


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
        
        const precoNumerico = parseFloat(removeMascara(precoUnitarioTexto));

        if (isNaN(precoNumerico) || isNaN(quantidade) || quantidade <= 0) {
            vendaPrecoFinalInput.value = 'Cálculo Inválido';
            return 0;
        }

        const precoFinal = precoNumerico * quantidade;
        vendaPrecoFinalInput.value = formatarMoedaExibicao(precoFinal);
        return precoFinal;
    }

    function preencherOpcoesProdutos() {
        vendaProdutoSelect.innerHTML = '<option value="" disabled selected>Selecione o Produto</option>';

        if (produtosCadastrados && produtosCadastrados.length > 0) {
            produtosCadastrados.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id; 
                option.textContent = produto.nome;
                
                option.dataset.id = produto.id;
                option.dataset.preco = produto.precoUnitario; 
                
                vendaProdutoSelect.appendChild(option);
            });
        } else {
            vendaProdutoSelect.innerHTML = '<option value="" disabled selected>Nenhum produto cadastrado. Cadastre um produto!</option>';
        }
    }

    function atualizarCamposProduto() {
        const selectedOption = vendaProdutoSelect.options[vendaProdutoSelect.selectedIndex];
        
        if (selectedOption && selectedOption.value !== "") {
            const produtoId = selectedOption.dataset.id;
            const precoVenda = parseFloat(selectedOption.dataset.preco);

            vendaIDInput.value = produtoId || 'N/A';
            vendaPrecoUnitarioInput.value = formatarMoedaExibicao(precoVenda || 0);

        } else {
            vendaIDInput.value = '';
            vendaPrecoUnitarioInput.value = '';
        }

        calcularPrecoFinal();
    }
    
    // --- EVENT LISTENERS ---
    
    vendaDataInput.addEventListener('change', atualizarMesComBaseNaData); 
    vendaProdutoSelect.addEventListener('change', atualizarCamposProduto);
    vendaQuantidadeInput.addEventListener('input', calcularPrecoFinal);

    // Formata o preço unitário ao sair do campo
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

        if (vendaProdutoSelect.value === "") {
            alert("Por favor, selecione um Produto.");
            return;
        }
        if (vendaStatusSelect.value === "") {
            alert("Por favor, selecione o Status (Entrada/Saída).");
            return;
        }
        
        vendaPrecoUnitarioInput.dispatchEvent(new Event('blur'));

        const precoFinal = calcularPrecoFinal();
        const precoUnitarioNumerico = parseFloat(removeMascara(vendaPrecoUnitarioInput.value));
        const precoFinalNumerico = precoFinal; 
        
        if (isNaN(precoFinalNumerico) || precoFinalNumerico < 0 || isNaN(precoUnitarioNumerico) || precoUnitarioNumerico < 0) {
            alert("Preço final/unitário inválido. Verifique o preço e a quantidade.");
            return;
        }

        const novaVenda = {
            data: vendaDataInput.value,
            mes: vendaMesSelect.value, 
            status: vendaStatusSelect.value,
            cliente: vendaClienteInput.value.trim() || 'N/A',
            produto: vendaProdutoSelect.options[vendaProdutoSelect.selectedIndex].textContent,
            id: vendaIDInput.value,
            precoUnitario: precoUnitarioNumerico, 
            quantidade: parseFloat(vendaQuantidadeInput.value),
            precoFinal: precoFinalNumerico, 
            metodoPagamento: vendaPagamentoSelect.value
        };

        vendas.push(novaVenda);
        salvarVendas();
        renderizarTabelaVendas();
        renderizarRanking();
        renderizarMesMaisVendedor(); 
        renderizarMetodoPagamentoMaisUsado();
        renderizarTabelaFaturamentoMensal(); 
        
        formAdicionarVenda.reset();
        
        // Reset manual
        vendaDataInput.value = hoje; 
        atualizarMesComBaseNaData(); 
        
        vendaIDInput.value = '';
        vendaPrecoUnitarioInput.value = '';
        vendaPrecoFinalInput.value = '';
        vendaQuantidadeInput.value = 1; 
    });


    // --- LÓGICA DA TABELA DE FATURAMENTO MENSAL (Entradas) ---

    function calcularFaturamentoMensal() {
        const faturamentoPorMes = {};
        
        for(let i = 1; i <= 12; i++) {
            faturamentoPorMes[i] = 0.00;
        }

        vendas.forEach(venda => {
            if (venda.status === 'entrada') { 
                const mesNumero = parseInt(venda.mes);
                const faturamento = venda.precoFinal; 

                if (faturamentoPorMes.hasOwnProperty(mesNumero)) {
                    faturamentoPorMes[mesNumero] += faturamento;
                }
            }
        });
        
        return faturamentoPorMes;
    }
    
    function renderizarTabelaFaturamentoMensal() {
        const faturamentoDados = calcularFaturamentoMensal();
        listaFaturamentoMensal.innerHTML = '';
        
        const mesMaisVendedorNome = document.getElementById('mesMaisVendeuNome').textContent;
        
        for (let i = 1; i <= 12; i++) {
            const row = listaFaturamentoMensal.insertRow();
            const mesNome = MESES_NOMES[i - 1];
            const total = faturamentoDados[i] || 0.00;

            row.insertCell(0).textContent = mesNome;
            
            const totalCell = row.insertCell(1);
            totalCell.textContent = formatarMoedaExibicao(total);
            totalCell.style.textAlign = 'right';
            
            if (mesNome === mesMaisVendedorNome && total > 0) {
                row.style.backgroundColor = '#fff0e0'; 
                totalCell.style.fontWeight = 'bold';
            }
        }
    }


    // --- LÓGICA DOS CARTÕES DE DESTAQUE E RANKING ---

    function calcularMesMaisVendedor() {
        const faturamentoPorMes = {};
        let mesMaisVendedor = null;
        let maiorFaturamento = 0;

        vendas.forEach(venda => {
            if (venda.status === 'entrada') { 
                const mesNumero = parseInt(venda.mes);
                const faturamento = venda.precoFinal; 

                if (!faturamentoPorMes[mesNumero]) {
                    faturamentoPorMes[mesNumero] = 0;
                }
                
                faturamentoPorMes[mesNumero] += faturamento;
            }
        });

        for (const mesNumero in faturamentoPorMes) {
            const total = faturamentoPorMes[mesNumero];
            
            if (total > maiorFaturamento) {
                maiorFaturamento = total;
                mesMaisVendedor = MESES_NOMES[parseInt(mesNumero) - 1]; 
            }
        }

        return { 
            nome: mesMaisVendedor, 
            valor: maiorFaturamento 
        };
    }

    function renderizarMesMaisVendedor() {
        const resultado = calcularMesMaisVendedor();

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
            if (venda.status === 'entrada') { 
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
            rankingLista.innerHTML = '<li>Nenhum dado de venda (entrada) para calcular o ranking.</li>';
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
            subtituloSpan.textContent = `Total Vendido: ${totalQuantidade} unidades`;

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
            
            const statusCell = row.insertCell(i++);
            statusCell.appendChild(statusDiv); // Status inserido corretamente
            
            row.insertCell(i++).textContent = item.cliente || 'N/A';
            row.insertCell(i++).textContent = item.produto;
            row.insertCell(i++).textContent = item.id;
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
        if (confirm('Tem certeza que deseja remover este registro de venda?')) {
            vendas.splice(index, 1);
            salvarVendas(); 
            renderizarTabelaVendas();
            renderizarRanking();
            renderizarMesMaisVendedor(); 
            renderizarMetodoPagamentoMaisUsado();
            renderizarTabelaFaturamentoMensal(); 
        }
    }

    function limparTabelaVendas() {
        if (confirm('Tem certeza que deseja limpar TODOS os registros de venda da lista?')) {
            vendas = [];
            salvarVendas(); 
            renderizarTabelaVendas();
            renderizarRanking();
            renderizarMesMaisVendedor(); 
            renderizarMetodoPagamentoMaisUsado();
            renderizarTabelaFaturamentoMensal(); 
        }
    }

    btnLimparVendas.addEventListener('click', limparTabelaVendas);
});
