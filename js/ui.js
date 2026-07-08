/* ============================================================
   CALMWRITE - UI Module
   ============================================================
   Componentes de interface: telas, modal, barra de progresso,
   notificações e utilitários DOM.
   
   NOTA: Todas as funções buscam elementos diretamente no DOM
   via document.getElementById() para evitar bugs de referência.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  var UI = {
    /** Inicializa referências DOM para módulos que dependem delas */
    initDOMElements: function() {
      // Armazena referências para acesso por outros módulos (settings, navigation)
      this._elements = {
        homeScreen: document.getElementById('home-screen'),
        readingScreen: document.getElementById('reading-screen'),
        settingsPanel: document.getElementById('settings-panel'),
        settingsBackdrop: document.getElementById('settings-backdrop'),
        
        textModalOverlay: document.getElementById('text-modal-overlay'),
        textInput: document.getElementById('text-input'),
        btnStartReading: document.getElementById('btn-start-reading'),
        btnProcessText: document.getElementById('btn-process-text'),
        btnCancelText: document.getElementById('btn-cancel-text'),
        
        readingBlock: document.getElementById('reading-block'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        navPrev: document.getElementById('nav-prev'),
        navNext: document.getElementById('nav-next'),
        
        settingsToggle: document.getElementById('settings-toggle'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        themeDark: document.getElementById('theme-dark'),
        themeLight: document.getElementById('theme-light'),
        themeSepia: document.getElementById('theme-sepia'),
        themeNavy: document.getElementById('theme-navy'),
        themeSky: document.getElementById('theme-sky'),
        toggleFullscreen: document.getElementById('toggle-fullscreen'),
        toggleHideCursor: document.getElementById('toggle-hide-cursor'),
        toggleHighContrast: document.getElementById('toggle-high-contrast'),
        toggleAnimations: document.getElementById('toggle-animations'),
        toggleSounds: document.getElementById('toggle-sounds'),
        toggleSpotifyVisible: document.getElementById('toggle-spotify-visible'),
        fontSizeSlider: document.getElementById('font-size-slider'),
        lineHeightSlider: document.getElementById('line-height-slider'),
        animSpeedSlider: document.getElementById('anim-speed-slider'),
        wordsPerBlockSlider: document.getElementById('words-per-block-slider'),
        musicVolumeSlider: document.getElementById('music-volume-slider'),
        effectsVolumeSlider: document.getElementById('effects-volume-slider'),
        fontSelect: document.getElementById('font-select'),
        soundSelect: document.getElementById('sound-select'),
        animTypeSelect: document.getElementById('anim-type-select'),
        
        keyboardHint: document.getElementById('keyboard-hint'),
        toast: document.getElementById('toast'),
        
        resumeModalOverlay: document.getElementById('resume-modal-overlay'),
        btnResumeYes: document.getElementById('btn-resume-yes'),
        btnResumeNo: document.getElementById('btn-resume-no'),
        
        progressBar: document.getElementById('progress-bar'),
      };
      
      // Ambient buttons (precisa de querySelectorAll)
      this._ambientButtons = document.querySelectorAll('.ambient-btn');
    },

    /** Retorna os elementos cacheados (para módulos externos) */
    get elements() {
      return this._elements || {};
    },

    /** Retorna os botões de ambiente */
    get ambientButtons() {
      return this._ambientButtons || [];
    },

    createLogoSVG: function(size) {
      size = size || 80;
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">'
        + '<circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>'
        + '<path d="M28 25C28 23.8954 28.8954 23 30 23H50C51.1046 23 52 23.8954 52 25V55C52 56.1046 51.1046 57 50 57H30C28.8954 57 28 56.1046 28 55V25Z" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1.5"/>'
        + '<path d="M34 33H46" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>'
        + '<path d="M34 39H46" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>'
        + '<path d="M34 45H42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>'
        + '<path d="M28 25L40 20L52 25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>'
        + '<circle cx="40" cy="40" r="12" stroke="currentColor" stroke-width="1" opacity="0.15"/>'
        + '</svg>';
    },

    switchScreen: function(from, to, onComplete) {
      if (from) from.classList.add('screen--hidden');
      if (to) to.classList.remove('screen--hidden');
      if (onComplete) {
        setTimeout(onComplete, 350);
      }
    },

    showToast: function(message, duration) {
      duration = duration || 2000;
      var toast = document.getElementById('toast');
      if (!toast) return;
      
      toast.textContent = message;
      toast.classList.add('toast--visible');
      
      clearTimeout(toast._hideTimeout);
      toast._hideTimeout = setTimeout(function() {
        toast.classList.remove('toast--visible');
      }, duration);
    },

    showKeyboardHint: function(visible) {
      visible = visible !== false;
      var hint = document.getElementById('keyboard-hint');
      if (!hint) return;
      
      hint.classList.toggle('keyboard-hint--visible', visible);
      clearTimeout(hint._hideTimeout);
      if (visible) {
        hint._hideTimeout = setTimeout(function() {
          hint.classList.remove('keyboard-hint--visible');
        }, 4000);
      }
    },

    updateProgress: function(current, total) {
      var fill = document.getElementById('progress-fill');
      var text = document.getElementById('progress-text');
      
      if (fill) {
        var percent = total > 0 ? ((current + 1) / total) * 100 : 0;
        fill.style.width = Math.min(percent, 100) + '%';
      }
      if (text) {
        text.textContent = (current + 1) + ' / ' + total;
      }
    },

    openTextModal: function() {
      // Fechar qualquer outro modal que esteja aberto (resume, etc)
      this.closeResumeModal();
      
      var overlay = document.getElementById('text-modal-overlay');
      var input = document.getElementById('text-input');
      if (!overlay || !input) {
        console.warn('CalmWrite: Modal elements not found');
        return;
      }
      
      overlay.classList.add('modal-overlay--visible');
      setTimeout(function() { input.focus(); }, 100);
    },

    closeTextModal: function() {
      var overlay = document.getElementById('text-modal-overlay');
      if (overlay) {
        overlay.classList.remove('modal-overlay--visible');
      }
    },

    openResumeModal: function() {
      var overlay = document.getElementById('resume-modal-overlay');
      if (overlay) {
        overlay.classList.add('modal-overlay--visible');
      }
    },

    closeResumeModal: function() {
      var overlay = document.getElementById('resume-modal-overlay');
      if (overlay) {
        overlay.classList.remove('modal-overlay--visible');
      }
    },

    openSettings: function() {
      var panel = document.getElementById('settings-panel');
      var backdrop = document.getElementById('settings-backdrop');
      if (panel) panel.classList.add('settings-panel--open');
      if (backdrop) backdrop.classList.add('settings-panel-backdrop--visible');
    },

    closeSettings: function() {
      var panel = document.getElementById('settings-panel');
      var backdrop = document.getElementById('settings-backdrop');
      if (panel) panel.classList.remove('settings-panel--open');
      if (backdrop) backdrop.classList.remove('settings-panel-backdrop--visible');
    },

    showReadingBlock: function(text, animType) {
      var block = document.getElementById('reading-block');
      if (!block) return;
      
      block.textContent = text;
      
      // Cancelar animação RAF anterior se existir
      if (block._rafId) {
        cancelAnimationFrame(block._rafId);
        block._rafId = null;
      }
      
      // Limpar estilos inline residuais
      block.style.opacity = '1';
      block.style.transform = '';
      block.style.filter = '';
      
      // Respeitar configuração de animações desativadas
      var animationsEnabled = document.documentElement.dataset.animationsEnabled !== 'false';
      
      if (!animationsEnabled) {
        return;
      }
      
      animType = animType || 'fade';
      var animSpeed = parseFloat(document.documentElement.dataset.animSpeed || '1');
      var duration = 300 * animSpeed;
      
      // --- Animação 100% JS pura ---
      // Não usa CSS transitions, nem Web Animations API.
      // Loop manual com requestAnimationFrame que interpola
      // os valores a cada frame. Imune a prefers-reduced-motion.
      
      var startTime = performance.now();
      
      // Estado inicial e alvo
      var fromOpacity = 0;
      var fromY = 0;
      var fromScale = 1;
      var fromBlur = 0;
      
      switch (animType) {
        case 'slide':
          fromY = 20;
          break;
        case 'scale':
          fromScale = 0.95;
          break;
        case 'blur':
          fromBlur = 4;
          break;
      }
      
      // Aplicar estado inicial imediatamente
      block.style.opacity = fromOpacity;
      block.style.transform = fromScale !== 1 ? 'scale(' + fromScale + ')' : (fromY !== 0 ? 'translateY(' + fromY + 'px)' : '');
      block.style.filter = fromBlur > 0 ? 'blur(' + fromBlur + 'px)' : '';
      
      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }
      
      function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeOutCubic(progress);
        
        // Opacidade: de 0 até 1
        block.style.opacity = fromOpacity + (1 - fromOpacity) * eased;
        
        // Transform: animar Y e/ou Scale
        var currentY = fromY * (1 - eased);
        var currentScale = fromScale + (1 - fromScale) * eased;
        var transformParts = [];
        if (fromY !== 0) transformParts.push('translateY(' + currentY + 'px)');
        if (fromScale !== 1) transformParts.push('scale(' + currentScale + ')');
        block.style.transform = transformParts.join(' ');
        
        // Blur
        if (fromBlur > 0) {
          block.style.filter = 'blur(' + (fromBlur * (1 - eased)) + 'px)';
        }
        
        if (progress < 1) {
          block._rafId = requestAnimationFrame(step);
        } else {
          // Finalizar no estado exato
          block.style.opacity = '1';
          block.style.transform = '';
          block.style.filter = '';
          block._rafId = null;
        }
      }
      
      block._rafId = requestAnimationFrame(step);
    }
  };

  window.CalmWrite.UI = UI;
})();
