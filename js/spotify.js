/* ============================================================
   CALMWRITE - Spotify Module
   ============================================================
   Integração com Spotify Embed Iframe API para tocar playlists
   como música ambiente. Adaptado do código React do usuário.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function SpotifyManager() {
    this.controller = null;
    this.api = null;
    this.isReady = false;
    this.isPlaying = false;
    this.currentUrl = '';
    this.container = null;
    this._initCalled = false;
    this._listeners = {};
  }

  /**
   * Inicializa: carrega o script da API do Spotify
   */
  SpotifyManager.prototype.init = function() {
    if (this._initCalled) return;
    this._initCalled = true;

    var self = this;

    // Verificar se o script já foi carregado
    if (document.querySelector('script[src*="spotify.com/embed/iframe-api"]')) {
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    // Callback chamado pela API quando estiver pronta
    window.onSpotifyIframeApiReady = function(SpotifyIframeApi) {
      self.api = SpotifyIframeApi;
      self.isReady = true;
      self._emit('ready');

      // Se tem URL pendente, criar controller
      if (self.currentUrl) {
        self.createController(self.currentUrl);
      }
    };
  };

  /**
   * Cria o controller do Spotify embed no container
   */
  SpotifyManager.prototype.createController = function(url) {
    var self = this;

    if (!this.api || !this.container) {
      // API ainda não carregou ou container não definido
      this.currentUrl = url;
      return;
    }

    // Destruir controller anterior se existir
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }

    this.currentUrl = url;

    // Limpar o container
    this.container.innerHTML = '';

    this.api.createController(
      this.container,
      {
        width: '100%',
        height: '80',
        uri: url,
      },
      function(spotifyEmbedController) {
        self.controller = spotifyEmbedController;

        spotifyEmbedController.addListener('ready', function() {
          self._emit('playerReady');
        });

        spotifyEmbedController.addListener('playback_update', function(e) {
          var data = e.data;
          self.isPlaying = !data.isPaused;

          // Notificar listeners
          self._emit('playbackUpdate', {
            position: data.position,
            duration: data.duration,
            isPaused: data.isPaused,
            isBuffering: data.isBuffering
          });
        });

        spotifyEmbedController.addListener('playback_started', function() {
          self.isPlaying = true;
          self._emit('playbackStarted');
        });
      }
    );
  };

  /**
   * Define o container onde o embed será renderizado
   */
  SpotifyManager.prototype.setContainer = function(element) {
    this.container = element;

    // Se já tem URL, criar controller
    if (this.currentUrl && this.isReady) {
      this.createController(this.currentUrl);
    }
  };

  /**
   * Tocar
   */
  SpotifyManager.prototype.play = function() {
    if (this.controller) {
      this.controller.play();
    }
  };

  /**
   * Pausar
   */
  SpotifyManager.prototype.pause = function() {
    if (this.controller) {
      this.controller.pause();
    }
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
   * Carregar nova URL/entidade
   */
  SpotifyManager.prototype.loadUrl = function(url) {
    if (!url || url === this.currentUrl) return;

    if (this.controller) {
      this.controller.loadEntity(url);
      this.currentUrl = url;
    } else if (this.isReady) {
      this.createController(url);
    } else {
      this.currentUrl = url;
    }
  };

  /**
   * Parar e destruir o controller
   */
  SpotifyManager.prototype.stop = function() {
    if (this.controller) {
      this.controller.pause();
      this.controller.destroy();
      this.controller = null;
    }
    this.isPlaying = false;
    this.currentUrl = '';
    if (this.container) {
      this.container.innerHTML = '';
    }
  };

  /**
   * Pausar (sem destruir)
   */
  SpotifyManager.prototype.pauseOnly = function() {
    if (this.controller) {
      this.controller.pause();
    }
    this.isPlaying = false;
  };

  /**
   * Registrar listeners de eventos internos
   */
  SpotifyManager.prototype.on = function(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  };

  /**
   * Remover listener
   */
  SpotifyManager.prototype.off = function(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(fn) {
      return fn !== callback;
    });
  };

  /**
   * Emitir evento interno
   */
  SpotifyManager.prototype._emit = function(event, data) {
    var listeners = this._listeners[event];
    if (!listeners) return;
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](data);
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
