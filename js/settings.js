/* ============================================================
   CALMWRITE - Settings Module
   ============================================================
   Painel de configurações completo: temas, fonte, som,
   animações, acessibilidade e fullscreen.
   ============================================================ */

import { elements, showToast, closeSettings, openSettings } from './ui.js';
import { audioManager } from './audio.js';
import { saveSettings } from './storage.js';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 1.125,
  lineHeight: 1.75,
  animSpeed: 1,
  animType: 'fade',
  soundType: 'paper',
  musicVolume: 0.3,
  effectsVolume: 0.4,
  soundsEnabled: true,
  animationsEnabled: true,
  hideCursor: false,
  highContrast: false,
  fontFamily: 'atkinson',
  ambientMusic: null,
};

export class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.isOpen = false;
    this._listeners = [];
    
    // Bind
    this._handleToggle = this._handleToggle.bind(this);
    this._handleTheme = this._handleTheme.bind(this);
    this._handleSlider = this._handleSlider.bind(this);
    this._handleFullscreen = this._handleFullscreen.bind(this);
    this._handleEscape = this._handleEscape.bind(this);
  }

  /**
   * Inicializa as configurações
   * @param {Object} savedSettings - Configurações salvas anteriormente
   */
  init(savedSettings = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
    this._applyAll();
    this._bindEvents();
  }

  /**
   * Obtém uma configuração
   */
  get(key) {
    return this.settings[key];
  }

  /**
   * Obtém todas as configurações
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * Atualiza uma configuração e dispara eventos
   */
  set(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    this._applySetting(key, value);
    this._notifyListeners(key, value, oldValue);
    this._save();
  }

  /**
   * Atualiza múltiplas configurações
   */
  setMultiple(updates) {
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.settings[key];
      this.settings[key] = value;
      this._applySetting(key, value);
      this._notifyListeners(key, value, oldValue);
    }
    this._save();
  }

  /**
   * Registra um listener para mudanças
   * @param {Function} callback - (key, value, oldValue) => void
   */
  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  /**
   * Alterna o painel de configurações
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Abre o painel
   */
  open() {
    this.isOpen = true;
    openSettings();
  }

  /**
   * Fecha o painel
   */
  close() {
    this.isOpen = false;
    closeSettings();
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================

  _bindEvents() {
    const els = elements;
    
    // Toggle settings
    if (els.settingsToggle) {
      els.settingsToggle.addEventListener('click', () => this.toggle());
    }
    if (els.btnCloseSettings) {
      els.btnCloseSettings.addEventListener('click', () => this.close());
    }
    if (els.settingsBackdrop) {
      els.settingsBackdrop.addEventListener('click', () => this.close());
    }
    
    // Theme
    if (els.themeDark) els.themeDark.addEventListener('click', () => this.set('theme', 'dark'));
    if (els.themeLight) els.themeLight.addEventListener('click', () => this.set('theme', 'light'));
    if (els.themeSepia) els.themeSepia.addEventListener('click', () => this.set('theme', 'sepia'));
    
    // Toggles
    if (els.toggleFullscreen) {
      els.toggleFullscreen.addEventListener('change', this._handleFullscreen);
    }
    if (els.toggleHideCursor) {
      els.toggleHideCursor.addEventListener('change', (e) => this.set('hideCursor', e.target.checked));
    }
    if (els.toggleHighContrast) {
      els.toggleHighContrast.addEventListener('change', (e) => this.set('highContrast', e.target.checked));
    }
    if (els.toggleAnimations) {
      els.toggleAnimations.addEventListener('change', (e) => this.set('animationsEnabled', e.target.checked));
    }
    if (els.toggleSounds) {
      els.toggleSounds.addEventListener('change', (e) => {
        this.set('soundsEnabled', e.target.checked);
        audioManager.setEnabled(e.target.checked);
      });
    }
    
    // Sliders
    if (els.fontSizeSlider) {
      els.fontSizeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.set('fontSize', val);
        const label = document.getElementById('font-size-label');
        if (label) label.textContent = val.toFixed(2) + 'rem';
      });
    }
    if (els.lineHeightSlider) {
      els.lineHeightSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.set('lineHeight', val);
        const label = document.getElementById('line-height-label');
        if (label) label.textContent = val.toFixed(2);
      });
    }
    if (els.animSpeedSlider) {
      els.animSpeedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.set('animSpeed', val);
        const label = document.getElementById('anim-speed-label');
        if (label) label.textContent = val.toFixed(2) + 'x';
      });
    }
    if (els.musicVolumeSlider) {
      els.musicVolumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.set('musicVolume', val);
        audioManager.setMusicVolume(val);
        const label = document.getElementById('music-volume-label');
        if (label) label.textContent = Math.round(val * 100) + '%';
      });
    }
    if (els.effectsVolumeSlider) {
      els.effectsVolumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.set('effectsVolume', val);
        audioManager.setEffectsVolume(val);
        const label = document.getElementById('effects-volume-label');
        if (label) label.textContent = Math.round(val * 100) + '%';
      });
    }
    
    // Selects
    if (els.fontSelect) {
      els.fontSelect.addEventListener('change', (e) => this.set('fontFamily', e.target.value));
    }
    if (els.soundSelect) {
      els.soundSelect.addEventListener('change', (e) => this.set('soundType', e.target.value));
    }
    if (els.animTypeSelect) {
      els.animTypeSelect.addEventListener('change', (e) => this.set('animType', e.target.value));
    }
    
    // Ambient buttons
    if (els.ambientButtons) {
      els.ambientButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.ambient;
          if (audioManager.toggleAmbient(type)) {
            this.set('ambientMusic', type);
          } else {
            this.set('ambientMusic', null);
          }
        });
      });
    }
    
    // Escape key
    document.addEventListener('keydown', this._handleEscape);
  }

  _handleToggle(e) {
    const key = e.target.dataset.setting;
    if (key) {
      this.set(key, e.target.checked);
    }
  }

  _handleTheme(e) {
    const theme = e.target.dataset.theme;
    if (theme) {
      this.set('theme', theme);
    }
  }

  _handleSlider(e) {
    const key = e.target.dataset.setting;
    if (key) {
      this.set(key, parseFloat(e.target.value));
    }
  }

  _handleFullscreen(e) {
    if (e.target.checked) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  _handleEscape(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  // ============================================================
  // APPLY SETTINGS
  // ============================================================

  _applyAll() {
    for (const [key, value] of Object.entries(this.settings)) {
      this._applySetting(key, value);
    }
    this._syncUI();
  }

  _applySetting(key, value) {
    const root = document.documentElement;
    
    switch (key) {
      case 'theme':
        root.dataset.theme = value;
        this._updateThemeButtons(value);
        break;
        
      case 'fontSize':
        root.style.setProperty('--user-font-size', `${value}rem`);
        break;
        
      case 'lineHeight':
        root.style.setProperty('--user-line-height', value);
        break;
        
      case 'animSpeed':
        root.dataset.animSpeed = value;
        break;
        
      case 'animationsEnabled':
        root.dataset.animationsEnabled = value ? 'true' : 'false';
        break;
        
      case 'hideCursor':
        root.dataset.hideCursor = value ? 'true' : 'false';
        break;
        
      case 'highContrast':
        root.dataset.highContrast = value ? 'true' : 'false';
        break;
        
      case 'fontFamily':
        this._applyFont(value);
        break;
        
      case 'soundsEnabled':
        // handled by audio manager
        break;
        
      case 'musicVolume':
      case 'effectsVolume':
      case 'ambientMusic':
      case 'soundType':
      case 'animType':
        // handled elsewhere
        break;
    }
  }

  _applyFont(fontFamily) {
    const root = document.documentElement;
    const fonts = {
      'atkinson': "'Atkinson Hyperlegible', 'Nunito', sans-serif",
      'inter': "'Inter', sans-serif",
      'nunito': "'Nunito', sans-serif",
      'ibm-plex': "'IBM Plex Sans', sans-serif",
      'merriweather': "'Merriweather', Georgia, serif",
    };
    root.style.setProperty('--font-body', fonts[fontFamily] || fonts.atkinson);
  }

  _updateThemeButtons(activeTheme) {
    const { themeDark, themeLight, themeSepia } = elements;
    [themeDark, themeLight, themeSepia].forEach(btn => {
      if (btn) btn.classList.remove('theme-btn--active');
    });
    
    const map = { dark: themeDark, light: themeLight, sepia: themeSepia };
    const active = map[activeTheme];
    if (active) active.classList.add('theme-btn--active');
  }

  _syncUI() {
    const els = elements;
    const s = this.settings;
    
    // Theme buttons
    this._updateThemeButtons(s.theme);
    
    // Toggles
    if (els.toggleHideCursor) els.toggleHideCursor.checked = s.hideCursor;
    if (els.toggleHighContrast) els.toggleHighContrast.checked = s.highContrast;
    if (els.toggleAnimations) els.toggleAnimations.checked = s.animationsEnabled;
    if (els.toggleSounds) els.toggleSounds.checked = s.soundsEnabled;
    
    // Sliders
    if (els.fontSizeSlider) {
      els.fontSizeSlider.value = s.fontSize;
      const label = document.getElementById('font-size-label');
      if (label) label.textContent = s.fontSize.toFixed(2) + 'rem';
    }
    if (els.lineHeightSlider) {
      els.lineHeightSlider.value = s.lineHeight;
      const label = document.getElementById('line-height-label');
      if (label) label.textContent = s.lineHeight.toFixed(2);
    }
    if (els.animSpeedSlider) {
      els.animSpeedSlider.value = s.animSpeed;
      const label = document.getElementById('anim-speed-label');
      if (label) label.textContent = s.animSpeed.toFixed(2) + 'x';
    }
    if (els.musicVolumeSlider) {
      els.musicVolumeSlider.value = s.musicVolume;
      const label = document.getElementById('music-volume-label');
      if (label) label.textContent = Math.round(s.musicVolume * 100) + '%';
    }
    if (els.effectsVolumeSlider) {
      els.effectsVolumeSlider.value = s.effectsVolume;
      const label = document.getElementById('effects-volume-label');
      if (label) label.textContent = Math.round(s.effectsVolume * 100) + '%';
    }
    
    // Selects
    if (els.fontSelect) els.fontSelect.value = s.fontFamily;
    if (els.soundSelect) els.soundSelect.value = s.soundType;
    if (els.animTypeSelect) els.animTypeSelect.value = s.animType;
    
    // Ambient buttons
    if (els.ambientButtons) {
      els.ambientButtons.forEach(btn => {
        const type = btn.dataset.ambient;
        btn.classList.toggle('ambient-btn--active', s.ambientMusic === type);
        btn.classList.toggle('ambient-btn--playing', audioManager.activeAmbient === type);
      });
    }
  }

  // ============================================================
  // PERSISTENCE & NOTIFICATIONS
  // ============================================================

  _save() {
    const toSave = { ...this.settings };
    // Não salvar referências de objetos complexos
    saveSettings(toSave);
  }

  _notifyListeners(key, value, oldValue) {
    this._listeners.forEach(cb => {
      try {
        cb(key, value, oldValue);
      } catch (e) {
        console.warn('CalmWrite: Erro em listener de settings:', e.message);
      }
    });
  }

  /**
   * Sincroniza o estado da UI com as configurações atuais
   */
  syncUI() {
    this._syncUI();
  }
}
