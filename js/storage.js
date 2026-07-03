/* ============================================================
   CALMWRITE - Storage Module
   ============================================================
   Gerencia persistência no LocalStorage:
   - Auto-save do progresso de leitura
   - Salvamento de configurações
   - Detecção de sessão anterior para continuar
   ============================================================ */

const STORAGE_KEYS = {
  SESSION: 'calmwrite_session',
  SETTINGS: 'calmwrite_settings',
  TEXT: 'calmwrite_text',
};

/**
 * Salva a sessão atual (texto processado, bloco atual, timestamp)
 */
export function saveSession(blocks, currentIndex, originalText) {
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
}

/**
 * Carrega a sessão salva anteriormente
 * @returns {Object|null} Dados da sessão ou null se não existir
 */
export function loadSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.warn('CalmWrite: Erro ao carregar sessão:', e.message);
    return null;
  }
}

/**
 * Remove a sessão atual (após finalizar leitura)
 */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (e) {
    console.warn('CalmWrite: Erro ao limpar sessão:', e.message);
  }
}

/**
 * Salva as configurações do usuário
 * @param {Object} settings - Objeto com as configurações
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('CalmWrite: Erro ao salvar configurações:', e.message);
  }
}

/**
 * Carrega as configurações salvas
 * @param {Object} defaults - Valores padrão caso não haja configurações salvas
 * @returns {Object} Configurações mescladas com defaults
 */
export function loadSettings(defaults = {}) {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return { ...defaults };
    const saved = JSON.parse(data);
    return { ...defaults, ...saved };
  } catch (e) {
    console.warn('CalmWrite: Erro ao carregar configurações:', e.message);
    return { ...defaults };
  }
}

/**
 * Salva o texto original para referência
 */
export function saveOriginalText(text) {
  try {
    localStorage.setItem(STORAGE_KEYS.TEXT, text);
  } catch (e) {
    console.warn('CalmWrite: Erro ao salvar texto:', e.message);
  }
}

/**
 * Verifica se existe uma sessão anterior válida
 * @returns {boolean}
 */
export function hasPreviousSession() {
  const session = loadSession();
  if (!session || !session.blocks || !session.blocks.length) return false;
  
  // Validar se a sessão não é muito antiga (> 24 horas)
  const age = Date.now() - (session.timestamp || 0);
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas
  if (age > MAX_AGE) {
    clearSession();
    return false;
  }
  
  return true;
}
