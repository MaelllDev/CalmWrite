/* ============================================================
   CALMWRITE - Storage Module
   ============================================================
   Gerencia persistência no LocalStorage:
   - Auto-save do progresso de leitura
   - Salvamento de configurações
   - Detecção de sessão anterior para continuar
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  const STORAGE_KEYS = {
    SESSION: 'calmwrite_session',
    SETTINGS: 'calmwrite_settings',
    TEXT: 'calmwrite_text',
  };

  const Storage = {
    saveSession(blocks, currentIndex, originalText) {
      try {
        const session = {
          blocks,
          currentIndex,
          originalText,
          timestamp: Date.now(),
          version: 1,
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      } catch (e) {
        console.warn('CalmWrite: Erro ao salvar sessão:', e.message);
      }
    },

    loadSession() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (!data) return null;
        return JSON.parse(data);
      } catch (e) {
        console.warn('CalmWrite: Erro ao carregar sessão:', e.message);
        return null;
      }
    },

    clearSession() {
      try {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      } catch (e) {
        console.warn('CalmWrite: Erro ao limpar sessão:', e.message);
      }
    },

    saveSettings(settings) {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      } catch (e) {
        console.warn('CalmWrite: Erro ao salvar configurações:', e.message);
      }
    },

    loadSettings(defaults) {
      defaults = defaults || {};
      try {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!data) return Object.assign({}, defaults);
        const saved = JSON.parse(data);
        return Object.assign({}, defaults, saved);
      } catch (e) {
        console.warn('CalmWrite: Erro ao carregar configurações:', e.message);
        return Object.assign({}, defaults);
      }
    },

    saveOriginalText(text) {
      try {
        localStorage.setItem(STORAGE_KEYS.TEXT, text);
      } catch (e) {
        console.warn('CalmWrite: Erro ao salvar texto:', e.message);
      }
    },

    hasPreviousSession() {
      const session = this.loadSession();
      if (!session || !session.blocks || !session.blocks.length) return false;
      
      const age = Date.now() - (session.timestamp || 0);
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (age > MAX_AGE) {
        this.clearSession();
        return false;
      }
      return true;
    }
  };

  window.CalmWrite.Storage = Storage;
})();
