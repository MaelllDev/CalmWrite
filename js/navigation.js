/* ============================================================
   CALMWRITE - Navigation Module
   ============================================================
   Gerencia navegação entre blocos de texto via teclado,
   clique e touch. Controla histórico e direção.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function NavigationManager() {
    this.blocks = [];
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.history = [];
    this.animType = 'fade';
    this.soundType = 'paper';
    this.autoSaveEnabled = true;
    
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  NavigationManager.prototype.init = function(blocks, startIndex) {
    startIndex = startIndex || 0;
    this.blocks = blocks;
    this.currentIndex = startIndex;
    this.history = [];
    this.isTransitioning = false;
    
    if (!blocks || blocks.length === 0) {
      CalmWrite.UI.showToast('Nenhum texto para ler');
      return;
    }
    
    this._bindEvents();
    this._showCurrentBlock();
    this.updateProgressBar();
    CalmWrite.UI.showKeyboardHint(true);
    
    if (this.autoSaveEnabled) {
      this._autoSave();
    }
  };

  NavigationManager.prototype.updateSettings = function(settings) {
    var animMap = { fade: 'fade', slide: 'slide', blur: 'blur', scale: 'scale' };
    this.animType = animMap[settings.animType] || 'fade';
    this.soundType = settings.soundType || 'paper';
    this.autoSaveEnabled = settings.autoSave !== false;
  };

  NavigationManager.prototype.updateProgressBar = function() {
    CalmWrite.UI.updateProgress(this.currentIndex, this.blocks.length);
  };

  NavigationManager.prototype._bindEvents = function() {
    var self = this;
    document.addEventListener('keydown', this._handleKeyDown);
    
    var prevZone = document.getElementById('nav-prev');
    var nextZone = document.getElementById('nav-next');
    
    if (prevZone) {
      prevZone.addEventListener('click', function(e) {
        if (e.target.closest('.nav-zone')) self.goPrev();
      });
    }
    if (nextZone) {
      nextZone.addEventListener('click', function(e) {
        if (e.target.closest('.nav-zone')) self.goNext();
      });
    }
  };

  NavigationManager.prototype.destroy = function() {
    document.removeEventListener('keydown', this._handleKeyDown);
  };

  NavigationManager.prototype._handleKeyDown = function(e) {
    if (this.isTransitioning) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        this.goNext();
        break;
      case 'Backspace':
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        this.goPrev();
        break;
      case 'Escape':
        var event = new CustomEvent('calmwrite:escape');
        document.dispatchEvent(event);
        break;
    }
  };

  NavigationManager.prototype.goNext = function() {
    if (this.isTransitioning) return;
    if (this.currentIndex >= this.blocks.length - 1) {
      CalmWrite.UI.showToast('Fim do texto');
      var event = new CustomEvent('calmwrite:finished');
      document.dispatchEvent(event);
      return;
    }
    
    this.history.push(this.currentIndex);
    this.currentIndex++;
    this._navigateTo('next');
  };

  NavigationManager.prototype.goPrev = function() {
    if (this.isTransitioning) return;
    if (this.currentIndex <= 0) {
      CalmWrite.UI.showToast('Início do texto');
      return;
    }
    
    this.history.push(this.currentIndex);
    this.currentIndex--;
    this._navigateTo('prev');
  };

  NavigationManager.prototype.goTo = function(index) {
    if (index < 0 || index >= this.blocks.length) return;
    if (this.isTransitioning) return;
    
    this.history.push(this.currentIndex);
    this.currentIndex = index;
    this._navigateTo('next');
  };

  NavigationManager.prototype._navigateTo = function(direction) {
    this.isTransitioning = true;
    
    CalmWrite.audioManager.playNavSound(this.soundType);
    
    this._showCurrentBlock();
    this.updateProgressBar();
    
    if (this.autoSaveEnabled) {
      this._autoSave();
    }
    
    var animSpeed = parseFloat(document.documentElement.dataset.animSpeed || '1');
    var duration = 300 * animSpeed;
    
    var self = this;
    setTimeout(function() {
      self.isTransitioning = false;
    }, duration);
  };

  NavigationManager.prototype._showCurrentBlock = function() {
    var block = this.blocks[this.currentIndex];
    if (!block || block.trim().length === 0) {
      CalmWrite.UI.showReadingBlock('\u00A0', this.animType);
      return;
    }
    CalmWrite.UI.showReadingBlock(block, this.animType);
  };

  NavigationManager.prototype._autoSave = function() {
    var event = new CustomEvent('calmwrite:autosave', {
      detail: {
        currentIndex: this.currentIndex,
        totalBlocks: this.blocks.length,
      }
    });
    document.dispatchEvent(event);
  };

  NavigationManager.prototype.getProgress = function() {
    return {
      current: this.currentIndex,
      total: this.blocks.length,
      percentage: this.blocks.length > 0 
        ? ((this.currentIndex + 1) / this.blocks.length) * 100 
        : 0,
    };
  };

  NavigationManager.prototype.isFirst = function() {
    return this.currentIndex <= 0;
  };

  NavigationManager.prototype.isLast = function() {
    return this.currentIndex >= this.blocks.length - 1;
  };

  window.CalmWrite.NavigationManager = NavigationManager;
})();
