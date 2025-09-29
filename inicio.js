// --- inicio.js (Versão Estável: Rolagem Simples com Zoom no Centro) ---

document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.getElementById('cardContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!cardContainer || !prevBtn || !nextBtn) return;

    const allCards = Array.from(cardContainer.querySelectorAll('.card'));
    if (allCards.length === 0) return;

    // Calcula a distância exata para rolar um cartão de cada vez
    const cardWidth = allCards[0].offsetWidth;
    const gap = 30; // Deve ser igual ao CSS
    const scrollAmount = cardWidth + gap; 
    
    // Variável para otimizar o monitoramento de scroll
    let scrollTimeout; 

    // 1. Funções de Rolagem (Botões)
    prevBtn.addEventListener('click', () => {
        cardContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        cardContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
    
    // 2. Lógica de Animação de Zoom (Cartão Central)
    function updateActiveState() {
        // Encontra o ponto central da área visível do carrossel
        const centerOfViewport = cardContainer.scrollLeft + (cardContainer.clientWidth / 2);
        
        allCards.forEach(card => {
            // Posição do centro de cada cartão
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            
            // Tolerância: Define o quanto um cartão precisa estar próximo do centro
            const tolerance = card.offsetWidth * 0.4; 
            const isCenter = Math.abs(cardCenter - centerOfViewport) < tolerance;
            
            // Aplica ou remove a classe, e o CSS faz a transição suave
            card.classList.toggle('active-center', isCenter);
        });
    }

    // 3. Monitoramento de Scroll
    cardContainer.addEventListener('scroll', () => {
        // Usa o timeout (debounce) para garantir que o zoom seja atualizado de forma otimizada
        window.clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            updateActiveState(); 
        }, 66); // 66ms é um bom equilíbrio

        // Chama a função imediatamente também para garantir a transição durante a rolagem manual
        updateActiveState();

    }, { passive: true }); 

    // 4. Inicialização
    // Garante que o primeiro cartão esteja no centro ao carregar
    // (Rola para o primeiro cartão para que o scroll-snap-align entre em vigor)
    cardContainer.scrollLeft = 0; 

    // Chama o update após um pequeno atraso para que o navegador renderize o scroll-snap
    setTimeout(updateActiveState, 150); 
});