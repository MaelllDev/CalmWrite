/* ============================================================
   CALMWRITE - Text Processor Module
   ============================================================
   Processamento inteligente de texto:
   - Detecção de parágrafos por linhas em branco
   - Limpeza e normalização
   - Divisão inteligente sem quebrar palavras
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  const COMFORTABLE_MAX_LENGTH = 280;
  const ABSOLUTE_MAX_LENGTH = 500;

  function smartSplit(paragraph) {
    const length = paragraph.length;

    if (length <= COMFORTABLE_MAX_LENGTH) {
      return [paragraph];
    }

    if (length < 30) {
      return [paragraph];
    }

    const sentenceBreaks = splitBySentenceEndings(paragraph);
    if (sentenceBreaks.length > 1) {
      const allOk = sentenceBreaks.every(function(b) { return b.length <= ABSOLUTE_MAX_LENGTH; });
      if (allOk) return sentenceBreaks;
      const result = [];
      for (var i = 0; i < sentenceBreaks.length; i++) {
        if (sentenceBreaks[i].length > COMFORTABLE_MAX_LENGTH) {
          Array.prototype.push.apply(result, smartSplit(sentenceBreaks[i]));
        } else {
          result.push(sentenceBreaks[i]);
        }
      }
      return result;
    }

    const commaBreaks = splitByCommas(paragraph);
    if (commaBreaks.length > 1) {
      const allOk = commaBreaks.every(function(b) { return b.length <= ABSOLUTE_MAX_LENGTH; });
      if (allOk) return commaBreaks;
      const result = [];
      for (var i = 0; i < commaBreaks.length; i++) {
        if (commaBreaks[i].length > COMFORTABLE_MAX_LENGTH) {
          Array.prototype.push.apply(result, smartSplit(commaBreaks[i]));
        } else {
          result.push(commaBreaks[i]);
        }
      }
      return result;
    }

    const spaceBreaks = splitByNearestSpace(paragraph);
    if (spaceBreaks.length > 1) {
      const result = [];
      for (var i = 0; i < spaceBreaks.length; i++) {
        if (spaceBreaks[i].length > ABSOLUTE_MAX_LENGTH) {
          Array.prototype.push.apply(result, splitByNearestSpace(spaceBreaks[i], ABSOLUTE_MAX_LENGTH / 2));
        } else {
          result.push(spaceBreaks[i]);
        }
      }
      return result;
    }

    return [paragraph];
  }

  function splitBySentenceEndings(text) {
    var segments = [];
    var sentenceEndRegex = /[.!?;](?:\s+|$)/g;
    
    var lastIndex = 0;
    var match;
    var candidates = [];

    while ((match = sentenceEndRegex.exec(text)) !== null) {
      var segment = text.slice(lastIndex, match.index + 1).trim();
      if (segment.length > 0) {
        candidates.push({ text: segment, endIndex: match.index + 1 });
      }
      lastIndex = match.index + match[0].length;
    }

    var remaining = text.slice(lastIndex).trim();
    if (remaining.length > 0) {
      candidates.push({ text: remaining, endIndex: text.length });
    }

    if (candidates.length <= 1) return [text.trim()];

    var MERGE_THRESHOLD = 60;
    var current = '';
    
    for (var i = 0; i < candidates.length; i++) {
      if (current.length === 0) {
        current = candidates[i].text;
      } else if (current.length < MERGE_THRESHOLD || candidates[i].text.length < MERGE_THRESHOLD) {
        current += ' ' + candidates[i].text;
      } else {
        segments.push(current);
        current = candidates[i].text;
      }
    }
    
    if (current.length > 0) {
      segments.push(current);
    }

    return segments.length > 1 ? segments : candidates.map(function(c) { return c.text; });
  }

  function splitByCommas(text) {
    var commaPositions = [];
    for (var i = 0; i < text.length; i++) {
      if (text[i] === ',') {
        commaPositions.push(i);
      }
    }

    if (commaPositions.length === 0) return [text.trim()];

    var mid = text.length / 2;
    var bestPosition = -1;
    var bestDistance = Infinity;

    for (var i = 0; i < commaPositions.length; i++) {
      var pos = commaPositions[i];
      var leftSize = pos + 1;
      var rightSize = text.length - pos - 1;
      var maxBlock = Math.max(leftSize, rightSize);
      
      if (maxBlock <= ABSOLUTE_MAX_LENGTH) {
        var distance = Math.abs(pos - mid);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPosition = pos;
        }
      }
    }

    if (bestPosition === -1) return [text.trim()];

    var left = text.slice(0, bestPosition + 1).trim();
    var right = text.slice(bestPosition + 1).trim();

    var result = [];
    if (left.length > 0) result.push(left);
    if (right.length > 0) result.push(right);

    return result.length > 1 ? result : [text.trim()];
  }

  function splitByNearestSpace(text, targetLength) {
    targetLength = targetLength || COMFORTABLE_MAX_LENGTH;
    if (text.length <= targetLength) return [text.trim()];

    var splitPos = -1;
    var distance = Infinity;

    var searchStart = Math.max(0, Math.floor(targetLength * 0.6));
    var searchEnd = Math.min(text.length, Math.floor(targetLength * 1.4));

    for (var i = searchStart; i < searchEnd && i < text.length; i++) {
      if (text[i] === ' ') {
        var currentDistance = Math.abs(i - targetLength);
        if (currentDistance < distance) {
          distance = currentDistance;
          splitPos = i;
        }
      }
    }

    if (splitPos === -1) {
      for (var i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          var currentDistance = Math.abs(i - targetLength);
          if (currentDistance < distance) {
            distance = currentDistance;
            splitPos = i;
          }
        }
      }
    }

    if (splitPos === -1) return [text.trim()];

    var left = text.slice(0, splitPos).trim();
    var right = text.slice(splitPos + 1).trim();

    var result = [];
    if (left.length > 0) result.push(left);
    
    if (right.length > ABSOLUTE_MAX_LENGTH) {
      var subBlocks = splitByNearestSpace(right, targetLength);
      Array.prototype.push.apply(result, subBlocks);
    } else if (right.length > 0) {
      result.push(right);
    }

    return result.length > 0 ? result : [text.trim()];
  }

  window.CalmWrite.TextProcessor = {
    processText: function(rawText) {
      if (!rawText || typeof rawText !== 'string') {
        return [];
      }

      var text = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

      if (!text) return [];

      var paragraphs = text
        .split(/\n\s*\n+/)
        .map(function(p) { return p.trim(); })
        .filter(function(p) { return p.length > 0; });

      if (paragraphs.length === 0) return [];

      paragraphs = paragraphs.map(function(paragraph) {
        return paragraph
          .replace(/[ \t]+/g, ' ')
          .split('\n')
          .map(function(line) { return line.trim(); })
          .filter(function(line) { return line.length > 0; })
          .join(' ')
          .trim();
      }).filter(function(p) { return p.length > 0; });

      var blocks = [];
      for (var i = 0; i < paragraphs.length; i++) {
        var splitBlocks = smartSplit(paragraphs[i]);
        Array.prototype.push.apply(blocks, splitBlocks);
      }

      return blocks;
    }
  };
})();
