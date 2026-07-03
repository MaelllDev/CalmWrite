/* ============================================================
   CALMWRITE - Text Processor Module
   ============================================================
   Processamento inteligente de texto:
   - Detecção de parágrafos por linhas em branco
   - Limpeza e normalização
   - Divisão inteligente sem quebrar palavras
   ============================================================ */

/**
 * Tamanho máximo confortável para um bloco de texto (em caracteres)
 * Blocos maiores que isso serão divididos
 */
const COMFORTABLE_MAX_LENGTH = 280;

/**
 * Tamanho máximo absoluto (usado como fallback)
 */
const ABSOLUTE_MAX_LENGTH = 500;

/**
 * Processa o texto completo:
 * 1. Detecta parágrafos por linhas em branco
 * 2. Limpa espaços duplicados e linhas vazias
 * 3. Normaliza quebras de linha
 * 4. Divide parágrafos longos em blocos menores
 *
 * @param {string} rawText - Texto bruto do usuário
 * @returns {string[]} Array de blocos de texto prontos para leitura
 */
export function processText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  // --- ETAPA 1: NORMALIZAÇÃO INICIAL ---
  let text = rawText
    // Normalizar quebras de linha do Windows (CRLF -> LF)
    .replace(/\r\n/g, '\n')
    // Normalizar quebras de linha antigas (CR -> LF)
    .replace(/\r/g, '\n')
    // Remover espaços no início e fim
    .trim();

  if (!text) return [];

  // --- ETAPA 2: DETECTAR PARÁGRAFOS ---
  // Parágrafos são separados por uma ou mais linhas em branco
  let paragraphs = text
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) return [];

  // --- ETAPA 3: LIMPEZA DOS PARÁGRAFOS ---
  paragraphs = paragraphs.map(paragraph => {
    return paragraph
      // Remover espaços duplicados dentro do parágrafo
      .replace(/[ \t]+/g, ' ')
      // Remover linhas vazias dentro de parágrafos (quebras de linha simples)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
      .trim();
  }).filter(p => p.length > 0);

  // --- ETAPA 4: DIVISÃO INTELIGENTE DOS PARÁGRAFOS ---
  const blocks = [];
  for (const paragraph of paragraphs) {
    const splitBlocks = smartSplit(paragraph);
    blocks.push(...splitBlocks);
  }

  return blocks;
}

/**
 * Algoritmo de divisão inteligente:
 * - Se o parágrafo for confortável, mantém inteiro
 * - Se for grande, tenta dividir em sentenças (. ! ? ;)
 * - Se ainda grande, busca pela melhor vírgula
 * - Último caso: divide no espaço mais próximo do limite
 *
 * @param {string} paragraph - Parágrafo para dividir
 * @returns {string[]} Array de blocos
 */
function smartSplit(paragraph) {
  const length = paragraph.length;

  // Se for confortável, retorna inteiro
  if (length <= COMFORTABLE_MAX_LENGTH) {
    return [paragraph];
  }

  // Se for muito pequeno (não deveria acontecer, mas segurança)
  if (length < 30) {
    return [paragraph];
  }

  // --- TENTATIVA 1: Dividir por fim de sentença ---
  const sentenceBreaks = splitBySentenceEndings(paragraph);
  if (sentenceBreaks.length > 1) {
    // Verificar se todos os blocos resultantes são aceitáveis
    const allOk = sentenceBreaks.every(b => b.length <= ABSOLUTE_MAX_LENGTH);
    if (allOk) {
      return sentenceBreaks;
    }
    // Se ainda há blocos grandes, processá-los recursivamente
    const result = [];
    for (const block of sentenceBreaks) {
      if (block.length > COMFORTABLE_MAX_LENGTH) {
        result.push(...smartSplit(block));
      } else {
        result.push(block);
      }
    }
    return result;
  }

  // --- TENTATIVA 2: Dividir por vírgula ---
  const commaBreaks = splitByCommas(paragraph);
  if (commaBreaks.length > 1) {
    const allOk = commaBreaks.every(b => b.length <= ABSOLUTE_MAX_LENGTH);
    if (allOk) {
      return commaBreaks;
    }
    const result = [];
    for (const block of commaBreaks) {
      if (block.length > COMFORTABLE_MAX_LENGTH) {
        result.push(...smartSplit(block));
      } else {
        result.push(block);
      }
    }
    return result;
  }

  // --- TENTATIVA 3: Dividir no espaço mais próximo ao limite confortável ---
  const spaceBreaks = splitByNearestSpace(paragraph);
  if (spaceBreaks.length > 1) {
    const result = [];
    for (const block of spaceBreaks) {
      if (block.length > ABSOLUTE_MAX_LENGTH) {
        result.push(...splitByNearestSpace(block, ABSOLUTE_MAX_LENGTH / 2));
      } else {
        result.push(block);
      }
    }
    return result;
  }

  // Fallback: retorna o parágrafo inteiro
  return [paragraph];
}

/**
 * Divide o texto em sentenças usando pontuação final (. ! ? ;)
 * Tenta criar blocos o mais equilibrado possível
 */
function splitBySentenceEndings(text) {
  // Regex para detectar finais de sentença seguidos de espaço
  // Captura: . ! ? ; seguido de espaço ou fim de string
  const segments = [];
  const sentenceEndRegex = /[.!?;](?:\s+|$)/g;
  
  let lastIndex = 0;
  let match;
  const candidates = [];

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const segment = text.slice(lastIndex, match.index + 1).trim();
    if (segment.length > 0) {
      candidates.push({ text: segment, endIndex: match.index + 1 });
    }
    lastIndex = match.index + match[0].length;
  }

  // Última parte após o último delimitador
  const remaining = text.slice(lastIndex).trim();
  if (remaining.length > 0) {
    candidates.push({ text: remaining, endIndex: text.length });
  }

  if (candidates.length <= 1) return [text.trim()];

  // Estratégia de balanceamento: tenta agrupar sentenças pequenas
  // para evitar blocos muito pequenos
  const MERGE_THRESHOLD = 60; // Mesclar sentenças menores que isso
  let current = '';
  
  for (const candidate of candidates) {
    if (current.length === 0) {
      current = candidate.text;
    } else if (current.length < MERGE_THRESHOLD || candidate.text.length < MERGE_THRESHOLD) {
      current += ' ' + candidate.text;
    } else {
      segments.push(current);
      current = candidate.text;
    }
  }
  
  if (current.length > 0) {
    segments.push(current);
  }

  return segments.length > 1 ? segments : candidates.map(c => c.text);
}

/**
 * Divide o texto usando vírgulas como pontos de corte
 * Tenta criar blocos balanceados
 */
function splitByCommas(text) {
  const commaPositions = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ',') {
      commaPositions.push(i);
    }
  }

  if (commaPositions.length === 0) return [text.trim()];

  // Encontrar o ponto de corte ideal: vírgula mais próxima do meio do texto
  // que divida em blocos de tamanho razoável
  const mid = text.length / 2;
  let bestPosition = -1;
  let bestDistance = Infinity;

  for (const pos of commaPositions) {
    // Verificar se a divisão cria blocos de tamanho aceitável
    const leftSize = pos + 1;
    const rightSize = text.length - pos - 1;
    const maxBlock = Math.max(leftSize, rightSize);
    
    if (maxBlock <= ABSOLUTE_MAX_LENGTH) {
      const distance = Math.abs(pos - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPosition = pos;
      }
    }
  }

  if (bestPosition === -1) return [text.trim()];

  const left = text.slice(0, bestPosition + 1).trim();
  const right = text.slice(bestPosition + 1).trim();

  const result = [];
  if (left.length > 0) result.push(left);
  if (right.length > 0) result.push(right);

  return result.length > 1 ? result : [text.trim()];
}

/**
 * Divide o texto no espaço mais próximo ao limite especificado
 * Garante que nunca corta palavras
 */
function splitByNearestSpace(text, targetLength = COMFORTABLE_MAX_LENGTH) {
  if (text.length <= targetLength) return [text.trim()];

  // Procurar o espaço mais próximo antes de targetLength
  let splitPos = -1;
  let distance = Infinity;

  // Procurar para trás a partir de targetLength
  const searchStart = Math.max(0, Math.floor(targetLength * 0.6));
  const searchEnd = Math.min(text.length, Math.floor(targetLength * 1.4));

  for (let i = searchStart; i < searchEnd && i < text.length; i++) {
    if (text[i] === ' ') {
      const currentDistance = Math.abs(i - targetLength);
      if (currentDistance < distance) {
        distance = currentDistance;
        splitPos = i;
      }
    }
  }

  // Se não encontrou espaço no intervalo, procurar em todo o texto
  if (splitPos === -1) {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') {
        const currentDistance = Math.abs(i - targetLength);
        if (currentDistance < distance) {
          distance = currentDistance;
          splitPos = i;
        }
      }
    }
  }

  if (splitPos === -1) return [text.trim()];

  const left = text.slice(0, splitPos).trim();
  const right = text.slice(splitPos + 1).trim();

  const result = [];
  if (left.length > 0) result.push(left);
  
  // Recursivamente dividir a parte direita se ainda for grande
  if (right.length > ABSOLUTE_MAX_LENGTH) {
    const subBlocks = splitByNearestSpace(right, targetLength);
    result.push(...subBlocks);
  } else if (right.length > 0) {
    result.push(right);
  }

  return result.length > 0 ? result : [text.trim()];
}
