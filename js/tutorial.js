/* ============================================================
   CALMWRITE - Tutorial Module
   ============================================================
   Sistema de tutorial com balões explicativos que guiam
   o usuário pelos principais recursos do aplicativo.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  var currentStep = -1;
  var isActive = false;
  var overlay = null;
  var bubble = null;
  var highlightEl = null;

  var steps = [
    {
      target: '#home-logo-container',
      title: '👋 Bem-vindo ao CalmWrite!',
      text: 'Um aplicativo minimalista para ler textos com calma, um trecho por vez. Sem distrações.',
      position: 'bottom',
    },
    {
      target: '#btn-start-reading',
      title: '📝 Começar a leitura',
      text: 'Clique aqui para colar ou digitar um texto. O CalmWrite vai dividir ele em pequenos blocos para você ler com calma.',
      position: 'top',
    },
    {
      target: '#settings-toggle',
      title: '⚙️ Configurações',
      text: 'Aqui você pode trocar o tema (escuro, claro, sépia), ajustar fonte, tamanho do texto, ativar sons ambientes e muito mais.',
      position: 'left',
    },
    {
      target: '#text-input',
      title: '⌨️ Modal de texto',
      text: 'Cole qualquer texto aqui! Pode ser um artigo, um livro, anotações — o CalmWrite processa e divide em blocos confortáveis para leitura.',
      position: 'top',
      modalTrigger: '#text-modal-overlay',
    },
    {
      target: '#reading-block',
      title: '📖 Modo Leitura',
      text: 'Veja um bloco por vez. Use ESPAÇO, ENTER ou SETA DIREITA para avançar. BACKSPACE ou SETA ESQUERDA para voltar. Também pode clicar nas laterais da tela.',
      position: 'center',
    },
    {
      target: '#progress-bar',
      title: '📊 Progresso',
      text: 'Aqui mostra em qual bloco você está. A barra de progresso avança conforme você lê. O CalmWrite salva automaticamente seu progresso!',
      position: 'top',
    },
    {
      target: '#settings-toggle',
      title: '🎵 Música Ambiente',
      text: 'Nas Configurações, role até "Música Ambiente" e ative sons como Chuva, Floresta, Cafeteria ou Lo-fi para ajudar na concentração. Também dá pra ajustar volumes separados!',
      position: 'left',
    }
  ];

  function initTutorial() {
    // Check if tutorial was already seen
    if (localStorage.getItem('calmwrite_tutorial_done') === 'true') return;

    // Add tutorial button to the home screen
    var homeScreen = document.getElementById('home-screen');
    if (!homeScreen) return;

    var tutBtn = document.createElement('button');
    tutBtn.id = 'tutorial-btn';
    tutBtn.className = 'btn btn--ghost';
    tutBtn.style.marginTop = '12px';
    tutBtn.style.fontSize = '0.85rem';
    tutBtn.innerHTML = '🎯 Tour rápido';
    tutBtn.addEventListener('click', startTutorial);
    homeScreen.appendChild(tutBtn);
  }

  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorial-overlay';
    document.body.appendChild(overlay);

    bubble = document.createElement('div');
    bubble.className = 'tutorial-bubble';
    bubble.id = 'tutorial-bubble';
    document.body.appendChild(bubble);
  }

  function startTutorial() {
    isActive = true;
    currentStep = -1;
    createOverlay();
    overlay.classList.add('tutorial-overlay--visible');
    nextStep();
  }

  function nextStep() {
    currentStep++;
    if (currentStep >= steps.length) {
      endTutorial();
      return;
    }
    showStep(currentStep);
  }

  function prevStep() {
    if (currentStep <= 0) return;
    currentStep--;
    showStep(currentStep);
  }

  function showStep(index) {
    var step = steps[index];
    if (!step) return;

    // Remove previous highlight
    removeHighlight();

    // If step requires a modal to be open
    if (step.modalTrigger) {
      var modal = document.querySelector(step.modalTrigger);
      if (modal) modal.classList.add('modal-overlay--visible');
      // Close text modal if it was open from tutorial
      var textModal = document.getElementById('text-modal-overlay');
      if (textModal && step.modalTrigger !== '#text-modal-overlay') {
        textModal.classList.remove('modal-overlay--visible');
      }
    }

    // Find target and highlight it
    var target = document.querySelector(step.target);
    if (target) {
      highlightEl = target;
      target.classList.add('tutorial-highlight');
      
      // Scroll target into view if needed
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // Position and fill bubble
    if (bubble) {
      bubble.innerHTML = ''
        + '<div class="tutorial-bubble-header">'
        +   '<span class="tutorial-bubble-title">' + step.title + '</span>'
        +   '<button class="tutorial-bubble-close" id="tut-close">&times;</button>'
        + '</div>'
        + '<div class="tutorial-bubble-body">' + step.text + '</div>'
        + '<div class="tutorial-bubble-footer">'
        +   '<span class="tutorial-step-counter">' + (index + 1) + ' / ' + steps.length + '</span>'
        +   '<div class="tutorial-bubble-actions">'
        +     (index > 0 ? '<button class="btn btn--ghost" id="tut-prev" style="padding:6px 14px;font-size:13px;">← Voltar</button>' : '')
        +     '<button class="btn btn--primary" id="tut-next" style="padding:6px 14px;font-size:13px;">' + (index < steps.length - 1 ? 'Próximo →' : 'Finalizar ✓') + '</button>'
        +   '</div>'
        + '</div>';

      // Position the bubble
      positionBubble(step.position, target);

      // Update cursor count and step counter
      var stepCounter = bubble.querySelector('.tutorial-step-counter');
      if (stepCounter) {
        stepCounter.textContent = (index + 1) + ' / ' + steps.length;
      }

      // Bind events
      var nextBtn = document.getElementById('tut-next');
      if (nextBtn) nextBtn.addEventListener('click', nextStep);

      var prevBtn = document.getElementById('tut-prev');
      if (prevBtn) prevBtn.addEventListener('click', prevStep);

      var closeBtn = document.getElementById('tut-close');
      if (closeBtn) closeBtn.addEventListener('click', endTutorial);
    }
  }

  function positionBubble(position, target) {
    if (!bubble || !target) return;

    // Reset position
    bubble.style.left = '';
    bubble.style.right = '';
    bubble.style.top = '';
    bubble.style.bottom = '';
    bubble.style.transform = '';

    var targetRect = target.getBoundingClientRect();
    var bubbleWidth = 340;
    var margin = 16;

    switch (position) {
      case 'top':
        bubble.style.left = Math.max(margin, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, window.innerWidth - bubbleWidth - margin)) + 'px';
        bubble.style.bottom = (window.innerHeight - targetRect.top + margin) + 'px';
        break;
      case 'bottom':
        bubble.style.left = Math.max(margin, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, window.innerWidth - bubbleWidth - margin)) + 'px';
        bubble.style.top = (targetRect.bottom + margin) + 'px';
        break;
      case 'left':
        bubble.style.right = (window.innerWidth - targetRect.left + margin) + 'px';
        bubble.style.top = Math.max(margin, targetRect.top + targetRect.height / 2 - 80) + 'px';
        break;
      case 'right':
        bubble.style.left = (targetRect.right + margin) + 'px';
        bubble.style.top = Math.max(margin, targetRect.top + targetRect.height / 2 - 80) + 'px';
        break;
      case 'center':
        bubble.style.left = '50%';
        bubble.style.top = '50%';
        bubble.style.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  function removeHighlight() {
    if (highlightEl) {
      highlightEl.classList.remove('tutorial-highlight');
      highlightEl = null;
    }
    // Close any tutorial-opened modals
    var textModal = document.getElementById('text-modal-overlay');
    if (textModal) textModal.classList.remove('modal-overlay--visible');
  }

  function endTutorial() {
    isActive = false;
    removeHighlight();
    if (overlay) {
      overlay.classList.remove('tutorial-overlay--visible');
      overlay.remove();
      overlay = null;
    }
    if (bubble) {
      bubble.remove();
      bubble = null;
    }
    localStorage.setItem('calmwrite_tutorial_done', 'true');
  }

  window.CalmWrite.Tutorial = {
    init: initTutorial,
    start: startTutorial,
  };
})();
