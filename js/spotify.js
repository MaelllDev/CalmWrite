/* ============================================================
   CALMWRITE - Spotify Module
   ============================================================
   Integração com Spotify via iframe embed direto.
   O iframe tem controles nativos (play/pause/skip/volume).
   Basta carregar a URL que o player aparece.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function SpotifyManager() {
    this.currentUrl = '';
    this._container = null;
  }

  /**
   * Define o container do player flutuante
   */
  SpotifyManager.prototype.setContainer = function(element) {
    this._container = element;
  };

  /**
   * Extrai o ID da playlist a partir de uma URL do Spotify
   */
  SpotifyManager.prototype._extractPlaylistId = function(url) {
    if (!url) return null;
    if (/^[a-zA-Z0-9]{22}$/.test(url)) return url;
    var match = url.match(/playlist[\/:]([a-zA-Z0-9]{22})/);
    return match ? match[1] : null;
  };

  /**
   * Cria um iframe do Spotify no container
   */
  SpotifyManager.prototype._createIframe = function(container, height) {
    if (!container) return;

    var playlistId = this._extractPlaylistId(this.currentUrl);
    if (!playlistId) {
      container.innerHTML = '';
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = 'https://open.spotify.com/embed/playlist/' + playlistId
      + '?utm_source=generator&theme=0';
    iframe.width = '100%';
    iframe.height = height || '152';
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    iframe.style.borderRadius = '8px';
    iframe.title = 'Spotify Player';

    container.innerHTML = '';
    container.appendChild(iframe);
  };

  /**
   * Carrega a URL e cria/re cria os iframes
   */
  SpotifyManager.prototype.load = function(url) {
    this.currentUrl = url || '';

    // Atualizar player flutuante
    if (this._container) {
      if (this.currentUrl) {
        this._createIframe(this._container, '152');
      } else {
        this._container.innerHTML = '';
      }
    }
  };

  /**
   * Limpa o player
   */
  SpotifyManager.prototype.clear = function() {
    if (this._container) this._container.innerHTML = '';
  };

  window.CalmWrite.SpotifyManager = SpotifyManager;

  // Singleton
  if (!window.CalmWrite.spotifyManager) {
    window.CalmWrite.spotifyManager = new SpotifyManager();
  }
})();
