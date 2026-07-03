/* ============================================================
   CALMWRITE - UI Module
   ============================================================
   Componentes de interface: telas, modal, barra de progresso,
   notificações e utilitários DOM.
   ============================================================ */

/**
 * Referências aos elementos DOM
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export const elements = {};

/**
 * Inicializa as referências DOM
 */
export function initDOMElements() {
  Object.assign(elements, {
    // Telas
    homeScreen: $('#home-screen'),
    readingScreen: $('#reading-screen'),
    settingsPanel: $('#settings-panel'),
    settingsBackdrop: $('#settings-backdrop'),
    
    // Modal de texto
    textModal: $('#text-modal'),
    textModalOverlay: $('#text-modal-overlay'),
    textInput: $('#text-input'),
    btnStartReading: $('#btn-start-reading'),
    btnProcessText: $('#btn-process-text'),
    btnCancelText: $('#btn-cancel-text'),
    
    // Leitura
    readingBlock: $('#reading-block'),
    progressFill: $('#progress-fill'),
    progressText: $('#progress-text'),
    navPrev: $('#nav-prev'),
    navNext: $('#nav-next'),
    
    // Configurações
    settingsToggle: $('#settings-toggle'),
    btnCloseSettings: $('#btn-close-settings'),
    themeDark: $('#theme-dark'),
    themeLight: $('#theme-light'),
    themeSepia: $('#theme-sepia'),
    toggleFullscreen: $('#toggle-fullscreen'),
    toggleHideCursor: $('#toggle-hide-cursor'),
    toggleHighContrast: $('#toggle-high-contrast'),
    toggleAnimations: $('#toggle-animations'),
    toggleSounds: $('#toggle-sounds'),
    fontSizeSlider: $('#font-size-slider'),
    lineHeightSlider: $('#line-height-slider'),
    animSpeedSlider: $('#anim-speed-slider'),
    musicVolumeSlider: $('#music-volume-slider'),
    effectsVolumeSlider: $('#effects-volume-slider'),
    fontSelect: $('#font-select'),
    soundSelect: $('#sound-select'),
    animTypeSelect: $('#anim-type-select'),
    ambientButtons: $$('.ambient-btn'),
    
    // Keyboard hint
    keyboardHint: $('#keyboard-hint'),
    
    // Toast
    toast: $('#toast'),
    
    // Resume modal
    resumeModal: $('#resume-modal'),
    resumeModalOverlay: $('#resume-modal-overlay'),
    btnResumeYes: $('#btn-resume-yes'),
    btnResumeNo: $('#btn-resume-no'),
    
    // Progress bar container
    progressBar: $('#progress-bar'),
  });
}

/**
 * Cria o logo SVG do CalmWrite
 */
export function createLogoSVG(size = 80) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="1.5" opacity="0.2"/>
      <path d="M28 25C28 23.8954 28.8954 23 30 23H50C51.1046 23 52 23.8954 52 25V55C52 56.1046 51.1046 57 50 57H30C28.8954 57 28 56.1046 28 55V25Z" fill="currentColor" opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <path d="M34 33H46" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <path d="M34 39H46" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <path d="M34 45H42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
      <path d="M28 25L40 20L52 25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
      <circle cx="40" cy="40" r="12" stroke="currentColor" stroke-width="1" opacity="0.15"/>
    </svg>
  `;
}

/**
 * Troca de tela com animação
 * @param {HTMLElement} from - Tela atual
 * @param {HTMLElement} to - Próxima tela
 * @param {Function} onComplete - Callback após animação
 */
export function switchScreen(from, to, onComplete) {
  from.classList.add('screen--hidden');
  to.classList.remove('screen--hidden');
  
  if (onComplete) {
    setTimeout(onComplete, 350);
  }
}

/**
 * Mostra um toast/notificação
 * @param {string} message - Mensagem a exibir
 * @param {number} duration - Duração em ms
 */
export function showToast(message, duration = 2000) {
  const toast = elements.toast;
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('toast--visible');
  
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, duration);
}

/**
 * Mostra/esconde o hint de teclado
 */
export function showKeyboardHint(visible = true) {
  const hint = elements.keyboardHint;
  if (hint) {
    hint.classList.toggle('keyboard-hint--visible', visible);
    
    clearTimeout(hint._hideTimeout);
    if (visible) {
      hint._hideTimeout = setTimeout(() => {
        hint.classList.remove('keyboard-hint--visible');
      }, 4000);
    }
  }
}

/**
 * Atualiza a barra de progresso
 * @param {number} current - Índice atual (1-based)
 * @param {number} total - Total de blocos
 */
export function updateProgress(current, total) {
  const fill = elements.progressFill;
  const text = elements.progressText;
  
  if (fill) {
    const percent = total > 0 ? ((current) / total) * 100 : 0;
    fill.style.width = `${Math.min(percent, 100)}%`;
  }
  
  if (text) {
    text.textContent = `${current + 1} / ${total}`;
  }
}

/**
 * Abre o modal de texto
 */
export function openTextModal() {
  const overlay = elements.textModalOverlay;
  const input = elements.textInput;
  if (!overlay || !input) return;
  
  overlay.classList.add('modal-overlay--visible');
  setTimeout(() => input.focus(), 100);
}

/**
 * Fecha o modal de texto
 */
export function closeTextModal() {
  const overlay = elements.textModalOverlay;
  if (overlay) {
    overlay.classList.remove('modal-overlay--visible');
  }
}

/**
 * Abre o modal de resume
 */
export function openResumeModal() {
  const overlay = elements.resumeModalOverlay;
  if (overlay) {
    overlay.classList.add('modal-overlay--visible');
  }
}

/**
 * Fecha o modal de resume
 */
export function closeResumeModal() {
  const overlay = elements.resumeModalOverlay;
  if (overlay) {
    overlay.classList.remove('modal-overlay--visible');
  }
}

/**
 * Abre o painel de configurações
 */
export function openSettings() {
  const panel = elements.settingsPanel;
  const backdrop = elements.settingsBackdrop;
  if (panel) panel.classList.add('settings-panel--open');
  if (backdrop) backdrop.classList.add('settings-panel-backdrop--visible');
}

/**
 * Fecha o painel de configurações
 */
export function closeSettings() {
  const panel = elements.settingsPanel;
  const backdrop = elements.settingsBackdrop;
  if (panel) panel.classList.remove('settings-panel--open');
  if (backdrop) backdrop.classList.remove('settings-panel-backdrop--visible');
}

/**
 * Mostra um bloco de texto no leitor com animação
 * @param {string} text - Texto do bloco
 * @param {string} animType - Tipo de animação: 'fade' | 'slide' | 'scale' | 'blur'
 */
export function showReadingBlock(text, animType = 'fade') {
  const block = elements.readingBlock;
  if (!block) return;
  
  block.textContent = text;
  
  // Aplicar animação
  const animSpeed = parseFloat(document.documentElement.dataset.animSpeed || '1');
  const duration = 300 * animSpeed;
  
  block.style.opacity = '0';
  block.style.transform = '';
  block.style.filter = '';
  
  // Forçar reflow
  void block.offsetWidth;
  
  switch (animType) {
    case 'slide':
      block.style.transform = 'translateY(20px)';
      break;
    case 'scale':
      block.style.transform = 'scale(0.95)';
      break;
    case 'blur':
      block.style.filter = 'blur(4px)';
      break;
    default:
      break;
  }
  
  // Animação de entrada
  requestAnimationFrame(() => {
    block.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease, filter ${duration}ms ease`;
    block.style.opacity = '1';
    block.style.transform = 'translateY(0)';
    block.style.filter = 'blur(0)';
  });
}
