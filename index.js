// Aguarda o carregamento completo do documento HTML
document.addEventListener('DOMContentLoaded', function() {
    // 1. Pega o formulário e o elemento de mensagem de erro pelo ID
    const form = document.getElementById('loginForm');
    const mensagemErro = document.getElementById('mensagemErro');

    // 2. Adiciona um "ouvinte" de evento para quando o formulário for submetido
    form.addEventListener('submit', function(event) {
        
        // Impede o comportamento padrão de envio do formulário (que recarregaria a página)
        event.preventDefault(); 

        // Oculta qualquer mensagem de erro anterior
        mensagemErro.style.display = 'none';
        
        // 3. Pega os valores dos campos
        const usuario = document.getElementById('usuario').value;
        const senha = document.getElementById('senha').value;
        
        // 4. LÓGICA DE VERIFICAÇÃO SIMPLES (SOMENTE FRONT-END)
        // Em um sistema real, essa verificação seria feita em um servidor!
        
        if (usuario === 'kevin' && senha === '2020vrt89') {
            // Se o login for BEM-SUCEDIDO
            
            // Exibe mensagem de sucesso (opcional, apenas para demonstração)
            alert('Login bem-sucedido! Redirecionando...'); 
            
            // Redireciona para a página de início
            window.location.href = 'inicio.html'; 
            
        } else {
            // Se o login for MAL-SUCEDIDO
            
            // Exibe a mensagem de erro
            mensagemErro.textContent = 'Usuário ou senha inválidos. Tente novamente.';
            mensagemErro.style.display = 'block';
        }
    });
});