/* ============================================================
   CALMWRITE - Settings Module
   ============================================================
   Painel de configurações completo: temas, fonte, som,
   animações, acessibilidade e fullscreen.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  var DEFAULT_SETTINGS = {
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
    spotifyUrl: '',
    wordsPerBlock: 0,
  };

  function SettingsManager() {
    this.settings = {};
    this.isOpen = false;
    this._listeners = [];
    
    this._handleFullscreen = this._handleFullscreen.bind(this);
    this._handleEscape = this._handleEscape.bind(this);
  }

  SettingsManager.prototype.init = function(savedSettings) {
    savedSettings = savedSettings || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);
    
    // Store global reference so textProcessor can read wordsPerBlock
    CalmWrite.settingsManager = this;
    
    this._applyAll();
    this._bindEvents();
  };

  SettingsManager.prototype.get = function(key) {
    return this.settings[key];
  };

  SettingsManager.prototype.getAll = function() {
    return Object.assign({}, this.settings);
  };

  SettingsManager.prototype.set = function(key, value) {
    var oldValue = this.settings[key];
    this.settings[key] = value;
    
    this._applySetting(key, value);
    this._notifyListeners(key, value, oldValue);
    this._save();
  };

  SettingsManager.prototype.setMultiple = function(updates) {
    var keys = Object.keys(updates);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var oldValue = this.settings[key];
      this.settings[key] = updates[key];
      this._applySetting(key, updates[key]);
      this._notifyListeners(key, updates[key], oldValue);
    }
    this._save();
  };

  SettingsManager.prototype.onChange = function(callback) {
    this._listeners.push(callback);
    var self = this;
    return function() {
      self._listeners = self._listeners.filter(function(l) { return l !== callback; });
    };
  };

  SettingsManager.prototype.toggle = function() {
    if (this.isOpen) this.close();
    else this.open();
  };

  SettingsManager.prototype.open = function() {
    this.isOpen = true;
    CalmWrite.UI.openSettings();
  };

  SettingsManager.prototype.close = function() {
    this.isOpen = false;
    CalmWrite.UI.closeSettings();
  };

  SettingsManager.prototype._bindEvents = function() {
    var self = this;
    var els = CalmWrite.UI.elements;
    
    if (els.settingsToggle) {
      els.settingsToggle.addEventListener('click', function() { self.toggle(); });
    }
    if (els.btnCloseSettings) {
      els.btnCloseSettings.addEventListener('click', function() { self.close(); });
    }
    if (els.settingsBackdrop) {
      els.settingsBackdrop.addEventListener('click', function() { self.close(); });
    }
    
    if (els.themeDark) els.themeDark.addEventListener('click', function() { self.set('theme', 'dark'); });
    if (els.themeLight) els.themeLight.addEventListener('click', function() { self.set('theme', 'light'); });
    if (els.themeSepia) els.themeSepia.addEventListener('click', function() { self.set('theme', 'sepia'); });
    if (els.themeNavy) els.themeNavy.addEventListener('click', function() { self.set('theme', 'navy'); });
    if (els.themeSky) els.themeSky.addEventListener('click', function() { self.set('theme', 'sky'); });
    
    if (els.toggleFullscreen) {
      els.toggleFullscreen.addEventListener('change', this._handleFullscreen);
    }
    if (els.toggleHideCursor) {
      els.toggleHideCursor.addEventListener('change', function(e) { self.set('hideCursor', e.target.checked); });
    }
    if (els.toggleHighContrast) {
      els.toggleHighContrast.addEventListener('change', function(e) { self.set('highContrast', e.target.checked); });
    }
    if (els.toggleAnimations) {
      els.toggleAnimations.addEventListener('change', function(e) {
        // Invertido: checked = desativado, unchecked = ativado
        self.set('animationsEnabled', !e.target.checked);
      });
    }
    if (els.toggleSounds) {
      els.toggleSounds.addEventListener('change', function(e) {
        self.set('soundsEnabled', e.target.checked);
        CalmWrite.audioManager.setEnabled(e.target.checked);
      });
    }
    
    if (els.fontSizeSlider) {
      els.fontSizeSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        self.set('fontSize', val);
        var label = document.getElementById('font-size-label');
        if (label) label.textContent = val.toFixed(2) + 'rem';
      });
    }
    if (els.lineHeightSlider) {
      els.lineHeightSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        self.set('lineHeight', val);
        var label = document.getElementById('line-height-label');
        if (label) label.textContent = val.toFixed(2);
      });
    }
    if (els.animSpeedSlider) {
      els.animSpeedSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        self.set('animSpeed', val);
        var label = document.getElementById('anim-speed-label');
        if (label) label.textContent = val.toFixed(2) + 'x';
      });
    }
    if (els.musicVolumeSlider) {
      els.musicVolumeSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        self.set('musicVolume', val);
        CalmWrite.audioManager.setMusicVolume(val);
        var label = document.getElementById('music-volume-label');
        if (label) label.textContent = Math.round(val * 100) + '%';
      });
    }
    if (els.effectsVolumeSlider) {
      els.effectsVolumeSlider.addEventListener('input', function(e) {
        var val = parseFloat(e.target.value);
        self.set('effectsVolume', val);
        CalmWrite.audioManager.setEffectsVolume(val);
        var label = document.getElementById('effects-volume-label');
        if (label) label.textContent = Math.round(val * 100) + '%';
      });
    }
    
    if (els.fontSelect) {
      els.fontSelect.addEventListener('change', function(e) { self.set('fontFamily', e.target.value); });
    }
    if (els.soundSelect) {
      els.soundSelect.addEventListener('change', function(e) { self.set('soundType', e.target.value); });
    }
    if (els.animTypeSelect) {
      els.animTypeSelect.addEventListener('change', function(e) { self.set('animType', e.target.value); });
    }
    
    // Words per block
    if (els.wordsPerBlockSlider) {
      els.wordsPerBlockSlider.addEventListener('input', function(e) {
        var val = parseInt(e.target.value, 10);
        self.set('wordsPerBlock', val);
        var label = document.getElementById('words-per-block-label');
        if (label) label.textContent = val === 0 ? 'Automático' : val + ' palavras';
      });
    }
    
    // Ambient buttons - limpar Spotify se estiver tocando
    var ambientBtns = CalmWrite.UI.ambientButtons;
    if (ambientBtns && ambientBtns.length) {
      Array.from(ambientBtns).forEach(function(btn) {
        btn.addEventListener('click', function() {
          // Limpar Spotify (o audio.js faz isso também via startAmbient)
          CalmWrite.spotifyManager.clear();
          var miniPlayer = document.getElementById('spotify-mini-player');
          if (miniPlayer) miniPlayer.classList.add('mini-player--hidden');
          
          var type = btn.dataset.ambient;
          if (CalmWrite.audioManager.toggleAmbient(type)) {
            self.set('ambientMusic', type);
          } else {
            self.set('ambientMusic', null);
          }
        });
      });
    }
    
    // Spotify bindings
    self._bindSpotify();
    
    document.addEventListener('keydown', this._handleEscape);
  };

  SettingsManager.prototype._bindSpotify = function() {
    var self = this;
    var spotify = CalmWrite.spotifyManager;
    if (!spotify) return;

    var urlInput = document.getElementById('spotify-url');
    var miniPlayer = document.getElementById('spotify-mini-player');
    var miniContainer = document.getElementById('spotify-mini-embed');
    var miniClose = document.getElementById('btn-mini-close-spotify');

    // Set container do player flutuante
    spotify.setContainer(miniContainer);

    // Carrega iframe quando URL muda
    function loadUrl(url) {
      if (!url) {
        spotify.clear();
        if (miniPlayer) miniPlayer.classList.add('mini-player--hidden');
        return;
      }
      spotify.load(url);
      self.set('spotifyUrl', url);
      // Mostrar mini player na tela de leitura
      if (miniPlayer) miniPlayer.classList.remove('mini-player--hidden');
    }

    if (urlInput) {
      urlInput.addEventListener('change', function() {
        loadUrl(urlInput.value.trim());
      });
      urlInput.addEventListener('blur', function() {
        var url = urlInput.value.trim();
        if (url) loadUrl(url);
      });
      urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          loadUrl(urlInput.value.trim());
        }
      });
    }

    // Botão fechar mini player
    if (miniClose) {
      miniClose.addEventListener('click', function() {
        if (miniPlayer) miniPlayer.classList.add('mini-player--hidden');
        if (urlInput) {
          urlInput.value = '';
          self.set('spotifyUrl', '');
        }
        spotify.clear();
      });
    }

    // Restaurar URL salva
    var savedUrl = self.get('spotifyUrl');
    if (savedUrl && urlInput) {
      urlInput.value = savedUrl;
      loadUrl(savedUrl);
    }
  };

  SettingsManager.prototype._handleFullscreen = function(e) {
    if (e.target.checked) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  SettingsManager.prototype._handleEscape = function(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  SettingsManager.prototype._applyAll = function() {
    var self = this;
    var keys = Object.keys(this.settings);
    for (var i = 0; i < keys.length; i++) {
      self._applySetting(keys[i], this.settings[keys[i]]);
    }
    this._syncUI();
  };

  SettingsManager.prototype._applySetting = function(key, value) {
    var root = document.documentElement;
    
    switch (key) {
      case 'theme':
        root.dataset.theme = value;
        this._updateThemeButtons(value);
        break;
      case 'fontSize':
        root.style.setProperty('--user-font-size', value + 'rem');
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
      case 'musicVolume':
      case 'effectsVolume':
      case 'ambientMusic':
      case 'soundType':
      case 'animType':
        break;
    }
  };

  SettingsManager.prototype._applyFont = function(fontFamily) {
    var root = document.documentElement;
    var fonts = {
      'atkinson': "'Atkinson Hyperlegible', 'Nunito', sans-serif",
      'inter': "'Inter', sans-serif",
      'nunito': "'Nunito', sans-serif",
      'ibm-plex': "'IBM Plex Sans', sans-serif",
      'merriweather': "'Merriweather', Georgia, serif",
    };
    root.style.setProperty('--font-body', fonts[fontFamily] || fonts.atkinson);
  };

  SettingsManager.prototype._updateThemeButtons = function(activeTheme) {
    var els = CalmWrite.UI.elements;
    var buttons = [els.themeDark, els.themeLight, els.themeSepia, els.themeNavy, els.themeSky];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i]) buttons[i].classList.remove('theme-btn--active');
    }
    var map = { dark: els.themeDark, light: els.themeLight, sepia: els.themeSepia, navy: els.themeNavy, sky: els.themeSky };
    var active = map[activeTheme];
    if (active) active.classList.add('theme-btn--active');
  };

  SettingsManager.prototype._syncUI = function() {
    var els = CalmWrite.UI.elements;
    var s = this.settings;
    
    this._updateThemeButtons(s.theme);
    
    if (els.toggleHideCursor) els.toggleHideCursor.checked = s.hideCursor;
    if (els.toggleHighContrast) els.toggleHighContrast.checked = s.highContrast;
    if (els.toggleAnimations) els.toggleAnimations.checked = !s.animationsEnabled;
    if (els.toggleSounds) els.toggleSounds.checked = s.soundsEnabled;
    
    if (els.fontSizeSlider) {
      els.fontSizeSlider.value = s.fontSize;
      var label = document.getElementById('font-size-label');
      if (label) label.textContent = s.fontSize.toFixed(2) + 'rem';
    }
    if (els.lineHeightSlider) {
      els.lineHeightSlider.value = s.lineHeight;
      var label = document.getElementById('line-height-label');
      if (label) label.textContent = s.lineHeight.toFixed(2);
    }
    if (els.animSpeedSlider) {
      els.animSpeedSlider.value = s.animSpeed;
      var label = document.getElementById('anim-speed-label');
      if (label) label.textContent = s.animSpeed.toFixed(2) + 'x';
    }
    if (els.musicVolumeSlider) {
      els.musicVolumeSlider.value = s.musicVolume;
      var label = document.getElementById('music-volume-label');
      if (label) label.textContent = Math.round(s.musicVolume * 100) + '%';
    }
    if (els.effectsVolumeSlider) {
      els.effectsVolumeSlider.value = s.effectsVolume;
      var label = document.getElementById('effects-volume-label');
      if (label) label.textContent = Math.round(s.effectsVolume * 100) + '%';
    }
    
    if (els.fontSelect) els.fontSelect.value = s.fontFamily;
    if (els.soundSelect) els.soundSelect.value = s.soundType;
    if (els.animTypeSelect) els.animTypeSelect.value = s.animType;
    
    // Words per block
    if (els.wordsPerBlockSlider) {
      els.wordsPerBlockSlider.value = s.wordsPerBlock;
      var wpl = document.getElementById('words-per-block-label');
      if (wpl) wpl.textContent = s.wordsPerBlock === 0 ? 'Automático' : s.wordsPerBlock + ' palavras';
    }
    
    var ambientBtns = CalmWrite.UI.ambientButtons;
    if (ambientBtns && ambientBtns.length) {
      Array.from(ambientBtns).forEach(function(btn) {
        var type = btn.dataset.ambient;
        btn.classList.toggle('ambient-btn--active', s.ambientMusic === type);
        btn.classList.toggle('ambient-btn--playing', CalmWrite.audioManager.activeAmbient === type);
      });
    }
  };

  SettingsManager.prototype._save = function() {
    var toSave = Object.assign({}, this.settings);
    CalmWrite.Storage.saveSettings(toSave);
  };

  SettingsManager.prototype._notifyListeners = function(key, value, oldValue) {
    for (var i = 0; i < this._listeners.length; i++) {
      try {
        this._listeners[i](key, value, oldValue);
      } catch (e) {
        console.warn('CalmWrite: Erro em listener de settings:', e.message);
      }
    }
  };

  SettingsManager.prototype.syncUI = function() {
    this._syncUI();
  };

  window.CalmWrite.SettingsManager = SettingsManager;
})();
