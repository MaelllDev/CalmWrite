/* ============================================================
   CALMWRITE - Spotify Module
   ============================================================
   Integração com Spotify via iframe embed direto.
   Muito mais confiável que a Iframe API oficial.
   O iframe tem controles nativos (play/pause/skip).
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function SpotifyManager() {
    this.currentUrl = '';
    this.isPlaying = false;
    this.settingsIframe = null;   // iframe no painel de configurações
    this.miniIframe = null;       // iframe no mini player
    this._container = null;       // container em settings
    this._miniContainer = null;   // container no mini player
  }

  /**
   * Inicializa (não precisa de API, só registra os containers)
   */
  SpotifyManager.prototype.init = function() {
    // Nada a fazer aqui - o iframe será criado sob demanda
  };

  /**
   * Define o container principal (painel settings)
   */
  SpotifyManager.prototype.setContainer = function(element) {
    this._container = element;
  };

  /**
   * Define o container do mini player (tela de leitura)
   */
  SpotifyManager.prototype.setMiniContainer = function(element) {
    this._miniContainer = element;
  };

  /**
   * Extrai o ID da playlist a partir de uma URL do Spotify
   */
  SpotifyManager.prototype._extractPlaylistId = function(url) {
    if (!url) return null;

    // Já é um ID puro?
    if (/^[a-zA-Z0-9]{22}$/.test(url)) return url;

    // Tenta extrair de URL completa
    var match = url.match(/playlist[\/:]([a-zA-Z0-9]{22})/);
    return match ? match[1] : null;
  };

  /**
   * Cria um iframe do Spotify
   */
  SpotifyManager.prototype._createIframe = function(playlistId, height, container) {
    if (!playlistId || !container) return null;

    var theme = document.documentElement.dataset.theme === 'light' ? 0 : 0; // 0 = dark

    var iframe = document.createElement('iframe');
    iframe.src = 'https://open.spotify.com/embed/playlist/' + playlistId
      + '?utm_source=generator&theme=' + theme;
    iframe.width = '100%';
    iframe.height = height || '152';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    iframe.style.borderRadius = '8px';
    iframe.title = 'Spotify Player';

    // Limpar container e adicionar iframe
    container.innerHTML = '';
    container.appendChild(iframe);

    return iframe;
  };

  /**
   * Tocar a playlist
   */
  SpotifyManager.prototype.play = function() {
    var playlistId = this._extractPlaylistId(this.currentUrl);
    if (!playlistId) return;

    this.isPlaying = true;

    // Criar iframe no container principal (settings)
    if (this._container) {
      this.settingsIframe = this._createIframe(playlistId, '152', this._container);
    }

    // Criar iframe no mini player (tela de leitura)
    if (this._miniContainer) {
      this.miniIframe = this._createIframe(playlistId, '80', this._miniContainer);
    }

    this._emit('playbackStarted');
  };

  /**
   * Pausar - destrói os iframes (para o áudio) mas mantém a URL para resume
   */
  SpotifyManager.prototype.pause = function() {
    this.isPlaying = false;

    // Destruir iframes (para o áudio) mas manter currentUrl
    if (this._container) this._container.innerHTML = '';
    if (this._miniContainer) this._miniContainer.innerHTML = '';
    this.settingsIframe = null;
    this.miniIframe = null;

    this._emit('paused');
  };

  /**
   * Pausar (mesmo comportamento de pause)
   */
  SpotifyManager.prototype.pauseOnly = function() {
    this.pause();
  };

  /**
   * Toggle play/pause
   */
  SpotifyManager.prototype.togglePlay = function() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  /**
   * Carregar nova URL
   */
  SpotifyManager.prototype.loadUrl = function(url) {
    if (!url || url === this.currentUrl) return;

    this.currentUrl = url;

    // Se estiver tocando, recriar iframes
    if (this.isPlaying) {
      this.play();
    }
  };

  /**
   * Parar - destrói os iframes
   */
  SpotifyManager.prototype.stop = function() {
    this.isPlaying = false;
    this.currentUrl = '';

    // Destruir iframes
    if (this._container) this._container.innerHTML = '';
    if (this._miniContainer) this._miniContainer.innerHTML = '';

    this.settingsIframe = null;
    this.miniIframe = null;

    this._emit('stopped');
  };

  /**
   * Registrar listeners de eventos internos
   */
  SpotifyManager.prototype.on = function(event, callback) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  };

  SpotifyManager.prototype.off = function(event, callback) {
    if (!this._listeners || !this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(fn) {
      return fn !== callback;
    });
  };

  SpotifyManager.prototype._emit = function(event, data) {
    if (!this._listeners || !this._listeners[event]) return;
    for (var i = 0; i < this._listeners[event].length; i++) {
      try {
        this._listeners[event][i](data);
      } catch (e) {
        console.warn('CalmWrite Spotify: Erro no listener', event, e.message);
      }
    }
  };

  window.CalmWrite.SpotifyManager = SpotifyManager;

  // Singleton
  if (!window.CalmWrite.spotifyManager) {
    window.CalmWrite.spotifyManager = new SpotifyManager();
  }
})();
