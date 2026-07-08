/* ============================================================
   CALMWRITE - Application Orchestrator
   ============================================================
   Coordena todos os módulos: UI, navegação, áudio,
   configurações, processamento de texto e armazenamento.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function CalmWriteApp() {
    this.navigation = null;
    this.settings = null;
    this.originalText = '';
    this.isReading = false;
  }

  CalmWriteApp.prototype.init = function() {
    CalmWrite.UI.initDOMElements();
    
    this._setupAudioInit();
    this._setupSpotify();
    
    this.settings = new CalmWrite.SettingsManager();
    this.settings.init(CalmWrite.Storage.loadSettings());
    
    this.navigation = new CalmWrite.NavigationManager();
    
    var self = this;
    this.settings.onChange(function(key, value) {
      if (self.navigation && ['animType', 'soundType'].indexOf(key) !== -1) {
        self.navigation.updateSettings(self.settings.getAll());
      }
    });
    
    this.navigation.updateSettings(this.settings.getAll());
    
    this._setupEventListeners();
    this._checkPreviousSession();
    this._renderHomeScreen();
    
    console.log('🧘 CalmWrite pronto para uso');
  };

  CalmWriteApp.prototype._setupSpotify = function() {
    // Inicializar Spotify (carrega o script da API)
    if (CalmWrite.spotifyManager) {
      CalmWrite.spotifyManager.init();
    }
  };

  CalmWriteApp.prototype._setupAudioInit = function() {
    var initAudio = function() {
      CalmWrite.audioManager.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
  };

  CalmWriteApp.prototype._setupEventListeners = function() {
    var self = this;
    var els = CalmWrite.UI.elements;
    
    if (els.btnStartReading) {
      els.btnStartReading.addEventListener('click', function() {
        CalmWrite.UI.openTextModal();
      });
    }
    
    if (els.btnCancelText) {
      els.btnCancelText.addEventListener('click', function() {
        CalmWrite.UI.closeTextModal();
      });
    }
    
    if (els.btnProcessText) {
      els.btnProcessText.addEventListener('click', function() {
        self._startReading();
      });
    }
    
    if (els.textInput) {
      els.textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          self._startReading();
        }
      });
    }
    
    document.addEventListener('calmwrite:autosave', function(e) {
      self._autoSave(e.detail.currentIndex);
    });
    
    document.addEventListener('calmwrite:finished', function() {
      self._onReadingFinished();
    });
    
    document.addEventListener('calmwrite:escape', function() {
      if (self.isReading) {
        self._onReadingFinished();
      }
    });
    
    if (els.textModalOverlay) {
      els.textModalOverlay.addEventListener('click', function(e) {
        if (e.target === els.textModalOverlay) {
          CalmWrite.UI.closeTextModal();
        }
      });
    }
    
    if (els.btnResumeYes) {
      els.btnResumeYes.addEventListener('click', function() { self._resumeSession(true); });
    }
    if (els.btnResumeNo) {
      els.btnResumeNo.addEventListener('click', function() { self._resumeSession(false); });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
        } else {
          if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        }
      }
    });
  };

  CalmWriteApp.prototype._renderHomeScreen = function() {
    var logoContainer = document.getElementById('home-logo-container');
    if (logoContainer) {
      logoContainer.innerHTML = CalmWrite.UI.createLogoSVG(80);
    }
  };

  CalmWriteApp.prototype._checkPreviousSession = function() {
    if (CalmWrite.Storage.hasPreviousSession()) {
      setTimeout(function() { CalmWrite.UI.openResumeModal(); }, 500);
    }
  };

  CalmWriteApp.prototype._startReading = function() {
    var input = CalmWrite.UI.elements.textInput;
    if (!input) return;
    
    var rawText = input.value.trim();
    if (!rawText) {
      CalmWrite.UI.showToast('Cole ou digite um texto primeiro');
      return;
    }
    
    this.originalText = rawText;
    CalmWrite.Storage.saveOriginalText(rawText);
    
    var blocks = CalmWrite.TextProcessor.processText(rawText);
    
    if (!blocks || blocks.length === 0) {
      CalmWrite.UI.showToast('Não foi possível processar o texto');
      return;
    }
    
    CalmWrite.Storage.clearSession();
    CalmWrite.UI.closeTextModal();
    
    this._enterReadingMode(blocks, 0);
  };

  CalmWriteApp.prototype._enterReadingMode = function(blocks, startIndex) {
    startIndex = startIndex || 0;
    this.isReading = true;
    
    var self = this;
    CalmWrite.UI.switchScreen(CalmWrite.UI.elements.homeScreen, CalmWrite.UI.elements.readingScreen, function() {
      self.navigation.init(blocks, startIndex);
    });
  };

  CalmWriteApp.prototype._exitReadingMode = function() {
    this.isReading = false;
    this.navigation.destroy();
    CalmWrite.Storage.clearSession();
    CalmWrite.audioManager.stopAmbient();
    CalmWrite.UI.switchScreen(CalmWrite.UI.elements.readingScreen, CalmWrite.UI.elements.homeScreen);
    
    if (CalmWrite.UI.elements.textInput) {
      CalmWrite.UI.elements.textInput.value = '';
    }
  };

  CalmWriteApp.prototype._autoSave = function(currentIndex) {
    if (!this.navigation) return;
    CalmWrite.Storage.saveSession(
      this.navigation.blocks,
      currentIndex,
      this.originalText
    );
  };

  CalmWriteApp.prototype._onReadingFinished = function() {
    this._exitReadingMode();
    CalmWrite.UI.showToast('Leitura finalizada! 📖');
    if (this.settings) {
      this.settings.syncUI();
    }
  };

  CalmWriteApp.prototype._resumeSession = function(shouldResume) {
    CalmWrite.UI.closeResumeModal();
    
    if (shouldResume) {
      var session = CalmWrite.Storage.loadSession();
      if (session && session.blocks && session.blocks.length > 0) {
        this.originalText = session.originalText || '';
        this._enterReadingMode(session.blocks, session.currentIndex || 0);
        CalmWrite.UI.showToast('Continuando de onde parou');
      }
    }
  };

  window.CalmWriteApp = CalmWriteApp;
})();

// ============================================================
// INICIALIZAÇÃO
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    var app = new CalmWriteApp();
    app.init();
  });
} else {
  var app = new CalmWriteApp();
  app.init();
}
