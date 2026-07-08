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
    this._setupPDFWorker();
    
    this.settings = new CalmWrite.SettingsManager();
    this.settings.init(CalmWrite.Storage.loadSettings());
    
    this.navigation = new CalmWrite.NavigationManager();
    
    var self = this;
    this.settings.onChange(function(key, value) {
      if (self.navigation && ['animType', 'soundType'].indexOf(key) !== -1) {
        self.navigation.updateSettings(self.settings.getAll());
      }
      // Atualizar blocos em tempo real quando palavras por bloco mudar
      if (key === 'wordsPerBlock' && self.isReading && self.originalText) {
        clearTimeout(self._reprocessTimer);
        self._reprocessTimer = setTimeout(function() {
          self._reprocessBlocks();
        }, 100);
      }
    });
    
    this.navigation.updateSettings(this.settings.getAll());
    
    this._setupEventListeners();
    this._checkPreviousSession();
    this._renderHomeScreen();
    
    console.log('🧘 CalmWrite pronto para uso');
  };

  CalmWriteApp.prototype._setupSpotify = function() {
    // Spotify é gerenciado via iframe direto, não precisa de init
  };

  /** Configura o worker do pdf.js uma única vez */
  CalmWriteApp.prototype._setupPDFWorker = function() {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
    
    // --- PDF Import ---
    var btnImportPdf = document.getElementById('btn-import-pdf');
    var pdfInput = document.getElementById('pdf-input');
    
    if (btnImportPdf && pdfInput) {
      btnImportPdf.addEventListener('click', function() {
        pdfInput.click();
      });
      
      pdfInput.addEventListener('change', function(e) {
        self._importPDF(e.target);
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

    // Botão continuar sessão
    var btnResumeReading = document.getElementById('btn-resume-reading');
    if (btnResumeReading) {
      btnResumeReading.addEventListener('click', function() {
        if (CalmWrite.Storage.hasPreviousSession()) {
          CalmWrite.UI.openResumeModal();
        }
      });
    }

    // Botão sair da leitura
    var btnExitReading = document.getElementById('btn-exit-reading');
    if (btnExitReading) {
      btnExitReading.addEventListener('click', function() {
        if (self.isReading) {
          self._exitReadingMode();
        }
      });
    }

    // Botão editar texto completo
    var btnEditFull = document.getElementById('btn-edit-full');
    if (btnEditFull) {
      btnEditFull.addEventListener('click', function() {
        self._openFullTextEditor();
      });
    }

    // Botão editar bloco/parágrafo atual
    var btnEditBlock = document.getElementById('btn-edit-block');
    if (btnEditBlock) {
      btnEditBlock.addEventListener('click', function() {
        self._editCurrentParagraph();
      });
    }

    // Botão baixar TXT
    var btnDownloadTxt = document.getElementById('btn-download-txt');
    if (btnDownloadTxt) {
      btnDownloadTxt.addEventListener('click', function() {
        self._downloadTXT();
      });
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
      // Usar a logo real do assets
      logoContainer.innerHTML = '<img src="assets/icons/logo1024.svg" alt="CalmWrite" width="80" height="80" style="width:80px;height:80px">';
    }
    this._updateSessionIndicator();
    // Atualizar timer a cada 30s
    var self = this;
    clearInterval(this._sessionTimerInterval);
    this._sessionTimerInterval = setInterval(function() {
      self._updateSessionIndicator();
    }, 30000);
  };

  CalmWriteApp.prototype._updateSessionIndicator = function() {
    var indicator = document.getElementById('session-indicator');
    var timer = document.getElementById('session-timer');
    var btnResume = document.getElementById('btn-resume-reading');
    if (!indicator) return;
    
    if (CalmWrite.Storage.hasPreviousSession()) {
      indicator.style.display = 'inline-flex';
      if (btnResume) btnResume.style.display = 'inline-flex';
      if (timer) {
        var remaining = CalmWrite.Storage.getSessionTimeRemainingFormatted();
        timer.textContent = '· expira em ' + remaining;
      }
    } else {
      indicator.style.display = 'none';
      if (btnResume) btnResume.style.display = 'none';
      clearInterval(this._sessionTimerInterval);
    }
  };

  /**
   * Importa um arquivo PDF e extrai o texto usando pdf.js
   */
  CalmWriteApp.prototype._importPDF = function(fileInput) {
    var self = this;
    var file = fileInput.files && fileInput.files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      CalmWrite.UI.showToast('Por favor, selecione um arquivo PDF');
      fileInput.value = '';
      return;
    }
    
    CalmWrite.UI.showToast('Lendo PDF...');
    
    var reader = new FileReader();
    
    reader.onload = function(e) {
      var typedarray = new Uint8Array(e.target.result);
      
      // Carregar documento PDF
      pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
        var totalPages = pdf.numPages;
        var extractedPages = [];
        
        // Extrair texto de cada página
        var pagePromises = [];
        for (var i = 1; i <= totalPages; i++) {
          pagePromises.push(pdf.getPage(i).then(function(page) {
            return page.getTextContent().then(function(textContent) {
              var pageText = '';
              for (var j = 0; j < textContent.items.length; j++) {
                var item = textContent.items[j];
                if (item.str) {
                  pageText += item.str;
                  // Adicionar espaço ou quebra de linha baseado na posição
                  if (item.hasEOL) {
                    pageText += '\n';
                  } else {
                    pageText += ' ';
                  }
                }
              }
              return pageText;
            });
          }));
        }
        
        return Promise.all(pagePromises).then(function(pagesText) {
          var fullText = pagesText.join('\n\n').trim();
          
          // Colocar o texto extraído no textarea
          var textInput = document.getElementById('text-input');
          if (textInput) {
            textInput.value = fullText;
            textInput.focus();
          }
          
          CalmWrite.UI.showToast('PDF importado com sucesso! ' + totalPages + (totalPages === 1 ? ' página' : ' páginas'));
          fileInput.value = '';
        });
      }).catch(function(err) {
        console.error('Erro ao ler PDF:', err);
        CalmWrite.UI.showToast('Erro ao ler o PDF. Verifique se o arquivo é válido.');
        fileInput.value = '';
      });
    };
    
    reader.onerror = function() {
      CalmWrite.UI.showToast('Erro ao ler o arquivo');
      fileInput.value = '';
    };
    
    reader.readAsArrayBuffer(file);
  };

  CalmWriteApp.prototype._checkPreviousSession = function() {
    if (CalmWrite.Storage.hasPreviousSession()) {
      setTimeout(function() { CalmWrite.UI.openResumeModal(); }, 500);
    }
  };

  CalmWriteApp.prototype._startReading = function() {
    // Restaurar UI do modal ao estado padrão
    this._resetTextModalUI();

    var input = CalmWrite.UI.elements.textInput;
    if (!input) return;
    
    var rawText = input.value.trim();
    if (!rawText) {
      CalmWrite.UI.showToast('Cole ou digite um texto primeiro');
      return;
    }
    
    this.originalText = rawText;
    CalmWrite.Storage.saveOriginalText(rawText);
    
    // Passar palavras por bloco diretamente
    var wordsPerBlock = 0;
    if (this.settings) {
      wordsPerBlock = this.settings.get('wordsPerBlock') || 0;
    }
    var blocks = CalmWrite.TextProcessor.processText(rawText, { wordsPerBlock: wordsPerBlock });
    
    if (!blocks || blocks.length === 0) {
      CalmWrite.UI.showToast('Não foi possível processar o texto');
      return;
    }
    
    CalmWrite.Storage.clearSession();
    CalmWrite.UI.closeTextModal();
    
    this._enterReadingMode(blocks, 0);
  };

  /**
   * Re-processa os blocos em tempo real quando wordsPerBlock muda
   */
  CalmWriteApp.prototype._reprocessBlocks = function() {
    if (!this.isReading || !this.originalText || !this.navigation) return;
    
    var wordsPerBlock = this.settings ? this.settings.get('wordsPerBlock') || 0 : 0;
    var newBlocks = CalmWrite.TextProcessor.processText(this.originalText, { wordsPerBlock: wordsPerBlock });
    
    if (!newBlocks || newBlocks.length === 0) return;
    
    // Tentar manter posição próxima
    var oldIndex = this.navigation.currentIndex || 0;
    var newIndex = Math.min(oldIndex, newBlocks.length - 1);
    
    this.navigation.blocks = newBlocks;
    this.navigation.currentIndex = newIndex;
    this.navigation.history = [];
    
    // Atualizar texto direto, sem animação (evita piscar durante drag do slider)
    var blockEl = document.getElementById('reading-block');
    if (blockEl) {
      var blockText = newBlocks[newIndex] || '\u00A0';
      blockEl.textContent = blockText;
      blockEl.style.opacity = '1';
      blockEl.style.transform = '';
      blockEl.style.filter = '';
    }
    this.navigation.updateProgressBar();
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
    // Salvar sessão antes de sair (não limpar — usuário pode continuar depois)
    this._autoSave(this.navigation ? this.navigation.currentIndex : 0);
    CalmWrite.audioManager.stopAmbient();
    CalmWrite.UI.switchScreen(CalmWrite.UI.elements.readingScreen, CalmWrite.UI.elements.homeScreen);
    
    if (CalmWrite.UI.elements.textInput) {
      CalmWrite.UI.elements.textInput.value = '';
    }
    
    // Atualizar indicador de sessão na home
    this._updateSessionIndicator();
  };

  CalmWriteApp.prototype._autoSave = function(currentIndex) {
    if (!this.navigation) return;
    CalmWrite.Storage.saveSession(
      this.navigation.blocks,
      currentIndex,
      this.originalText
    );
  };

  CalmWriteApp.prototype._resetTextModalUI = function() {
    var title = document.getElementById('modal-title');
    var processBtn = document.getElementById('btn-process-text');
    var cancelBtn = document.getElementById('btn-cancel-text');
    if (title) title.textContent = 'Cole, escreva ou importe seu texto';
    if (processBtn) processBtn.textContent = 'Começar';
    if (cancelBtn) cancelBtn.textContent = 'Cancelar';
  };

  CalmWriteApp.prototype._openFullTextEditor = function() {
    if (!this.originalText) return;
    
    var overlay = document.getElementById('text-modal-overlay');
    var input = document.getElementById('text-input');
    var title = document.getElementById('modal-title');
    var processBtn = document.getElementById('btn-process-text');
    var cancelBtn = document.getElementById('btn-cancel-text');
    
    if (!overlay || !input) return;
    
    // Mudar título e botões
    if (title) title.textContent = 'Editando texto completo';
    if (processBtn) processBtn.textContent = 'Atualizar';
    if (cancelBtn) cancelBtn.textContent = 'Cancelar';
    
    // Preencher com o texto atual e abrir
    input.value = this.originalText;
    overlay.classList.add('modal-overlay--visible');
    setTimeout(function() { input.focus(); }, 100);
  };

  CalmWriteApp.prototype._editCurrentParagraph = function() {
    if (!this.navigation || !this.isReading) return;
    
    var block = document.getElementById('reading-block');
    if (!block) return;
    
    // Se já está editando, salvar
    if (block.isContentEditable) {
      this._saveEditedParagraph();
      return;
    }
    
    var btnEditBlock = document.getElementById('btn-edit-block');
    if (btnEditBlock) btnEditBlock.classList.add('reading-toolbar-btn--active');
    if (btnEditBlock) btnEditBlock.querySelector('span').textContent = 'Salvar';
    
    // Muda o bloco pra editável
    block.contentEditable = true;
    block.focus();
    
    // Placeholder visual
    block.style.outline = '2px solid var(--accent)';
    block.style.borderRadius = '4px';
    block.style.padding = '4px 8px';
  };

  CalmWriteApp.prototype._saveEditedParagraph = function() {
    var block = document.getElementById('reading-block');
    var btnEditBlock = document.getElementById('btn-edit-block');
    
    if (!block) return;
    
    var editedText = block.textContent.trim();
    if (!editedText) return;
    
    // Desabilitar edição
    block.contentEditable = false;
    block.style.outline = '';
    block.style.borderRadius = '';
    block.style.padding = '';
    
    if (btnEditBlock) btnEditBlock.classList.remove('reading-toolbar-btn--active');
    if (btnEditBlock) btnEditBlock.querySelector('span').textContent = 'Editar bloco';
    
    // Atualizar o bloco no array de blocos
    var idx = this.navigation.currentIndex;
    if (this.navigation.blocks && idx >= 0 && idx < this.navigation.blocks.length) {
      this.navigation.blocks[idx] = editedText;
    }
    
    // Reconstruir originalText a partir dos blocos
    this.originalText = this.navigation.blocks.join('\n\n');
    
    CalmWrite.UI.showToast('Parágrafo atualizado');
  };

  CalmWriteApp.prototype._downloadTXT = function() {
    if (!this.originalText) {
      CalmWrite.UI.showToast('Nenhum texto para baixar');
      return;
    }
    
    var blob = new Blob([this.originalText], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'calmwrite-texto.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    CalmWrite.UI.showToast('Texto baixado como .txt');
  };

  CalmWriteApp.prototype._onReadingFinished = function() {
    this._exitReadingMode();
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
