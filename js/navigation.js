/* ============================================================
   CALMWRITE - Navigation Module
   ============================================================
   Gerencia navegação entre blocos de texto via teclado,
   clique e touch. Controla histórico e direção.
   ============================================================ */

import { showReadingBlock, updateProgress, showKeyboardHint, showToast } from './ui.js';
import { audioManager } from './audio.js';
import { saveSession } from './storage.js';

export class NavigationManager {
  constructor() {
    this.blocks = [];
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.history = [];
    this.animType = 'fade';
    this.soundType = 'paper';
    this.autoSaveEnabled = true;
    
    // Bind handlers
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * Inicializa a navegação com os blocos de texto
   * @param {string[]} blocks - Array de blocos de texto
   * @param {number} startIndex - Índice inicial (para resume)
   */
  init(blocks, startIndex = 0) {
    this.blocks = blocks;
    this.currentIndex = startIndex;
    this.history = [];
    this.isTransitioning = false;
    
    if (!blocks || blocks.length === 0) {
      showToast('Nenhum texto para ler');
      return;
    }
    
    this._bindEvents();
    this._showCurrentBlock();
    this.updateProgressBar();
    showKeyboardHint(true);
    
    // Auto-save inicial
    if (this.autoSaveEnabled) {
      this._autoSave();
    }
  }

  /**
   * Atualiza as configurações de animação e som
   */
  updateSettings(settings) {
    const animMap = { fade: 'fade', slide: 'slide', blur: 'blur', scale: 'scale' };
    this.animType = animMap[settings.animType] || 'fade';
    this.soundType = settings.soundType || 'paper';
    this.autoSaveEnabled = settings.autoSave !== false;
  }

  /**
   * Atualiza a barra de progresso
   */
  updateProgressBar() {
    updateProgress(this.currentIndex, this.blocks.length);
  }

  /**
   * Registra eventos de navegação
   */
  _bindEvents() {
    document.addEventListener('keydown', this._handleKeyDown);
    
    const prevZone = document.getElementById('nav-prev');
    const nextZone = document.getElementById('nav-next');
    
    if (prevZone) {
      prevZone.addEventListener('click', (e) => {
        if (e.target.closest('.nav-zone')) this.goPrev();
      });
    }
    if (nextZone) {
      nextZone.addEventListener('click', (e) => {
        if (e.target.closest('.nav-zone')) this.goNext();
      });
    }
  }

  /**
   * Remove os eventos (cleanup)
   */
  destroy() {
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handler de teclado
   */
  _handleKeyDown(e) {
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
        // Abrir menu de saída ou configurações
        const event = new CustomEvent('calmwrite:escape');
        document.dispatchEvent(event);
        break;
    }
  }

  /**
   * Navega para o próximo bloco
   */
  goNext() {
    if (this.isTransitioning) return;
    if (this.currentIndex >= this.blocks.length - 1) {
      showToast('Fim do texto');
      // Disparar evento de finalização
      const event = new CustomEvent('calmwrite:finished');
      document.dispatchEvent(event);
      return;
    }
    
    this.history.push(this.currentIndex);
    this.currentIndex++;
    this._navigateTo('next');
  }

  /**
   * Navega para o bloco anterior
   */
  goPrev() {
    if (this.isTransitioning) return;
    if (this.currentIndex <= 0) {
      showToast('Início do texto');
      return;
    }
    
    this.history.push(this.currentIndex);
    this.currentIndex--;
    this._navigateTo('prev');
  }

  /**
   * Navega para um índice específico
   */
  goTo(index) {
    if (index < 0 || index >= this.blocks.length) return;
    if (this.isTransitioning) return;
    
    this.history.push(this.currentIndex);
    this.currentIndex = index;
    this._navigateTo('next');
  }

  /**
   * Executa a navegação com animação e som
   */
  _navigateTo(direction) {
    this.isTransitioning = true;
    
    // Tocar som de navegação
    audioManager.playNavSound(this.soundType);
    
    // Mostrar o novo bloco
    this._showCurrentBlock();
    this.updateProgressBar();
    
    // Auto-save
    if (this.autoSaveEnabled) {
      this._autoSave();
    }
    
    // Liberar transição após animação
    const animSpeed = parseFloat(document.documentElement.dataset.animSpeed || '1');
    const duration = 300 * animSpeed;
    
    setTimeout(() => {
      this.isTransitioning = false;
    }, duration);
  }

  /**
   * Mostra o bloco atual no leitor
   */
  _showCurrentBlock() {
    const block = this.blocks[this.currentIndex];
    if (!block || block.trim().length === 0) {
      // Bloco vazio: mostrar espaço ou mensagem
      showReadingBlock('\u00A0', this.animType);
      return;
    }
    showReadingBlock(block, this.animType);
  }

  /**
   * Salva o progresso automaticamente
   */
  _autoSave() {
    // Disparar evento para o app salvar
    const event = new CustomEvent('calmwrite:autosave', {
      detail: {
        currentIndex: this.currentIndex,
        totalBlocks: this.blocks.length,
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Retorna o progresso atual
   */
  getProgress() {
    return {
      current: this.currentIndex,
      total: this.blocks.length,
      percentage: this.blocks.length > 0 
        ? ((this.currentIndex + 1) / this.blocks.length) * 100 
        : 0,
    };
  }

  /**
   * Verifica se está no início
   */
  isFirst() {
    return this.currentIndex <= 0;
  }

  /**
   * Verifica se está no fim
   */
  isLast() {
    return this.currentIndex >= this.blocks.length - 1;
  }
}
