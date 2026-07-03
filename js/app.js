/* ============================================================
   CALMWRITE - Application Orchestrator
   ============================================================
   Coordena todos os módulos: UI, navegação, áudio,
   configurações, processamento de texto e armazenamento.
   ============================================================ */

import { processText } from './textProcessor.js';
import { audioManager } from './audio.js';
import { saveSession, loadSession, clearSession, saveOriginalText, hasPreviousSession } from './storage.js';
import { 
  initDOMElements, elements, createLogoSVG, switchScreen, 
  openTextModal, closeTextModal, openResumeModal, closeResumeModal,
  showToast 
} from './ui.js';
import { NavigationManager } from './navigation.js';
import { SettingsManager } from './settings.js';

class CalmWriteApp {
  constructor() {
    this.navigation = null;
    this.settings = null;
    this.originalText = '';
    this.isReading = false;
  }

  /**
   * Inicializa a aplicação
   */
  async init() {
    // Inicializar referências DOM
    initDOMElements();
    
    // Inicializar áudio (precisa de interação do usuário)
    this._setupAudioInit();
    
    // Inicializar configurações
    this.settings = new SettingsManager();
    this.settings.init();
    
    // Configurar navegação
    this.navigation = new NavigationManager();
    
    // Propagar configurações para navegação quando mudarem
    this.settings.onChange((key, value) => {
      if (this.navigation && ['animType', 'soundType'].includes(key)) {
        this.navigation.updateSettings(this.settings.getAll());
      }
    });
    
    // Propagar configurações iniciais para navegação
    this.navigation.updateSettings(this.settings.getAll());
    
    // Configurar listeners
    this._setupEventListeners();
    
    // Verificar sessão anterior
    this._checkPreviousSession();
    
    // Mostrar tela inicial
    this._renderHomeScreen();
    
    console.log('🧘 CalmWrite pronto para uso');
  }

  /**
   * Configura inicialização do áudio na primeira interação
   */
  _setupAudioInit() {
    const initAudio = () => {
      audioManager.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
  }

  /**
   * Configura todos os event listeners da aplicação
   */
  _setupEventListeners() {
    // Botão "Começar" na home → abre modal de texto
    if (elements.btnStartReading) {
      elements.btnStartReading.addEventListener('click', () => openTextModal());
    }
    
    // Botão "Cancelar" no modal → fecha modal
    if (elements.btnCancelText) {
      elements.btnCancelText.addEventListener('click', () => closeTextModal());
    }
    
    // Botão "Começar" no modal → processa texto e inicia leitura
    if (elements.btnProcessText) {
      elements.btnProcessText.addEventListener('click', () => this._startReading());
    }
    
    // Tecla Enter no textarea
    if (elements.textInput) {
      elements.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this._startReading();
        }
      });
    }
    
    // Evento de autosave
    document.addEventListener('calmwrite:autosave', (e) => {
      this._autoSave(e.detail.currentIndex);
    });
    
    // Evento de finalização
    document.addEventListener('calmwrite:finished', () => {
      this._onReadingFinished();
    });
    
    // Evento de escape (durante leitura)
    document.addEventListener('calmwrite:escape', () => {
      if (this.isReading) {
        this._onReadingFinished();
      }
    });
    
    // Fechar modal de texto clicando no overlay
    if (elements.textModalOverlay) {
      elements.textModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.textModalOverlay) {
          closeTextModal();
        }
      });
    }
    
    // Botões do modal de resume
    if (elements.btnResumeYes) {
      elements.btnResumeYes.addEventListener('click', () => this._resumeSession(true));
    }
    if (elements.btnResumeNo) {
      elements.btnResumeNo.addEventListener('click', () => this._resumeSession(false));
    }

    // Atalhos globais
    document.addEventListener('keydown', (e) => {
      // F11 para tela cheia
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    });
  }

  /**
   * Renderiza a tela inicial com logo e informações
   */
  _renderHomeScreen() {
    const logoContainer = document.getElementById('home-logo-container');
    if (logoContainer) {
      logoContainer.innerHTML = createLogoSVG(80);
    }
  }

  /**
   * Verifica se existe uma sessão anterior para continuar
   */
  _checkPreviousSession() {
    if (hasPreviousSession()) {
      setTimeout(() => openResumeModal(), 500);
    }
  }

  /**
   * Processa o texto e inicia a leitura
   */
  _startReading() {
    const input = elements.textInput;
    if (!input) return;
    
    const rawText = input.value.trim();
    if (!rawText) {
      showToast('Cole ou digite um texto primeiro');
      return;
    }
    
    // Salvar texto original
    this.originalText = rawText;
    saveOriginalText(rawText);
    
    // Processar texto
    const blocks = processText(rawText);
    
    if (!blocks || blocks.length === 0) {
      showToast('Não foi possível processar o texto');
      return;
    }
    
    // Limpar sessão anterior
    clearSession();
    
    // Fechar modal
    closeTextModal();
    
    // Iniciar modo leitura
    this._enterReadingMode(blocks, 0);
  }

  /**
   * Entra no modo de leitura
   */
  _enterReadingMode(blocks, startIndex = 0) {
    this.isReading = true;
    
    // Trocar para tela de leitura
    switchScreen(elements.homeScreen, elements.readingScreen, () => {
      // Inicializar navegação
      this.navigation.init(blocks, startIndex);
      
      // Esconder hint do teclado da home
      // (o navigation mostra o hint próprio)
    });
  }

  /**
   * Sai do modo de leitura e volta para home
   */
  _exitReadingMode() {
    this.isReading = false;
    this.navigation.destroy();
    clearSession();
    
    // Parar música ambiente
    audioManager.stopAmbient();
    
    // Voltar para home
    switchScreen(elements.readingScreen, elements.homeScreen);
    
    // Limpar textarea
    if (elements.textInput) {
      elements.textInput.value = '';
    }
  }

  /**
   * Auto-save do progresso
   */
  _autoSave(currentIndex) {
    if (!this.navigation) return;
    
    saveSession(
      this.navigation.blocks,
      currentIndex,
      this.originalText
    );
  }

  /**
   * Quando a leitura é finalizada
   */
  _onReadingFinished() {
    this._exitReadingMode();
    showToast('Leitura finalizada! 📖');
    
    // Sincronizar UI de settings
    if (this.settings) {
      this.settings.syncUI();
    }
  }

  /**
   * Continua ou reinicia a sessão anterior
   */
  _resumeSession(shouldResume) {
    closeResumeModal();
    
    if (shouldResume) {
      const session = loadSession();
      if (session && session.blocks && session.blocks.length > 0) {
        this.originalText = session.originalText || '';
        this._enterReadingMode(session.blocks, session.currentIndex || 0);
        showToast('Continuando de onde parou');
      }
    }
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Aguardar DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new CalmWriteApp();
    app.init();
  });
} else {
  const app = new CalmWriteApp();
  app.init();
}
