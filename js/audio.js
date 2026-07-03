/* ============================================================
   CALMWRITE - Audio Module
   ============================================================
   Geração de sons de navegação e música ambiente usando
   Web Audio API. Sem dependências de arquivos externos.
   ============================================================ */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.masterGain = null;
    this.isInitialized = false;
    this.activeAmbient = null;
    this.ambientNodes = [];
    this.settings = {
      musicVolume: 0.3,
      effectsVolume: 0.4,
      enabled: true,
      animSpeed: 1,
    };
  }

  /**
   * Inicializa o contexto de áudio (deve ser chamado após interação do usuário)
   */
  init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Cadeia de ganho: master -> music/effects
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.settings.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.effectsGain = this.ctx.createGain();
      this.effectsGain.gain.value = this.settings.effectsVolume;
      this.effectsGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('CalmWrite: Áudio não disponível:', e.message);
    }
  }

  /**
   * Resume o contexto de áudio (necessário após pausa do navegador)
   */
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ============================================================
  // SONS DE NAVEGAÇÃO
  // ============================================================

  /**
   * Som de "papel" - suave e acolhedor
   */
  playPaperSound() {
    if (!this.isReady()) return;
    this.resume();
    
    const now = this.ctx.currentTime;
    const duration = 0.15;

    // Ruído filtrado para som de papel/textura
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Som de "click" - suave e discreto
   */
  playClickSound() {
    if (!this.isReady()) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 0.05;

    // Tom puro curto e suave
    const osc = this.ctx.createOscillator();
    osc.frequency.value = 1200;
    osc.type = 'sine';

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Som de "máquina de escrever" - discreto
   */
  playTypewriterSound() {
    if (!this.isReady()) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = 0.08;

    // Ruído curto com envelope rápido
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Toca o som de navegação baseado na preferência
   */
  playNavSound(type = 'paper') {
    if (!this.settings.enabled) return;
    switch (type) {
      case 'paper': this.playPaperSound(); break;
      case 'click': this.playClickSound(); break;
      case 'typewriter': this.playTypewriterSound(); break;
      default: this.playPaperSound();
    }
  }

  // ============================================================
  // MÚSICA AMBIENTE
  // ============================================================

  /**
   * Inicia um som ambiente
   * @param {string} type - 'rain' | 'forest' | 'library' | 'cafe' | 'piano' | 'lofi' | 'wind' | 'fireplace'
   */
  startAmbient(type) {
    if (!this.isReady()) return;
    this.resume();
    this.stopAmbient();
    this.activeAmbient = type;

    switch (type) {
      case 'rain': this._createRain(); break;
      case 'forest': this._createForest(); break;
      case 'library': this._createLibrary(); break;
      case 'cafe': this._createCafe(); break;
      case 'piano': this._createPiano(); break;
      case 'lofi': this._createLofi(); break;
      case 'wind': this._createWind(); break;
      case 'fireplace': this._createFireplace(); break;
    }
  }

  /**
   * Para o som ambiente atual
   */
  stopAmbient() {
    this.ambientNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.ambientNodes = [];
    this.activeAmbient = null;
  }

  /**
   * Retorna se um som ambiente está tocando
   */
  isPlaying() {
    return this.activeAmbient !== null;
  }

  /**
   * Alterna play/pause do ambiente atual
   */
  toggleAmbient(type) {
    if (this.activeAmbient === type) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient(type);
      return true;
    }
  }

  // ============================================================
  // GERADORES DE AMBIENTE
  // ============================================================

  /**
   * Chuva - ruído rosa filtrado com modulação
   */
  _createRain() {
    const now = this.ctx.currentTime;
    
    // Ruído base
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Múltiplos filtros para som de chuva
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'highpass';
    filter1.frequency.value = 500;

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 3000;

    // Modulação para variação
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.3;
    lfo.type = 'sine';

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.25;

    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);
    
    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(now);
    lfo.start(now);

    this.ambientNodes = [source, lfo];
  }

  /**
   * Floresta - ruído com frequências naturais
   */
  _createForest() {
    const now = this.ctx.currentTime;
    
    // Vento leve nas árvores
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    // Sons de pássaros sutis (tons aleatórios)
    const birdOsc = this.ctx.createOscillator();
    birdOsc.type = 'sine';
    birdOsc.frequency.value = 2000;

    const birdGain = this.ctx.createGain();
    birdGain.gain.value = 0;
    
    // Modulação para simular cantos
    const birdLfo = this.ctx.createOscillator();
    birdLfo.frequency.value = 4;
    birdLfo.type = 'sine';

    const birdLfoGain = this.ctx.createGain();
    birdLfoGain.gain.value = 400;

    const birdModGain = this.ctx.createGain();
    birdModGain.gain.value = 0;

    // Gate para criar pausas
    const gateLfo = this.ctx.createOscillator();
    gateLfo.frequency.value = 0.1;
    gateLfo.type = 'sine';

    const gateGain = this.ctx.createGain();
    gateGain.gain.value = 0.03;

    gateLfo.connect(gateGain);
    gateGain.connect(birdModGain.gain);

    const mainGain = this.ctx.createGain();
    mainGain.gain.value = 0.2;

    source.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.musicGain);

    birdLfo.connect(birdLfoGain);
    birdLfoGain.connect(birdOsc.frequency);
    birdOsc.connect(birdModGain);
    birdModGain.connect(this.musicGain);

    source.start(now);
    birdOsc.start(now);
    birdLfo.start(now);
    gateLfo.start(now);

    this.ambientNodes = [source, birdOsc, birdLfo, gateLfo];
  }

  /**
   * Biblioteca - silêncio absoluto com muito baixo ruído
   */
  _createLibrary() {
    const now = this.ctx.currentTime;
    
    // Ruído quase inaudível (vento de ar condicionado)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    source.start(now);
    this.ambientNodes = [source];
  }

  /**
   * Cafeteria - ruído de fundo com conversas sutis
   */
  _createCafe() {
    const now = this.ctx.currentTime;
    
    // Ruído murmurante
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Ruído com envelope suave para simular conversas
      const mod = 0.5 + 0.5 * Math.sin(i / (this.ctx.sampleRate * 2));
      data[i] = (Math.random() * 2 - 1) * 0.2 * mod;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'highpass';
    filter1.frequency.value = 400;

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 2000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.musicGain);

    source.start(now);
    this.ambientNodes = [source];
  }

  /**
   * Piano - notas suaves e aleatórias (ambiente)
   */
  _createPiano() {
    const now = this.ctx.currentTime;
    
    const playNote = (freq, startTime, duration) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      // Envelope suave tipo piano
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
      
      return osc;
    };

    // Escala suave em Dó maior
    const notes = [262, 294, 330, 349, 392, 440, 494, 523]; // C4 a C5
    const nodes = [];
    
    // Tocar notas aleatórias em intervalos
    let time = now;
    for (let i = 0; i < 12; i++) {
      const note = notes[Math.floor(Math.random() * notes.length)];
      const duration = 1 + Math.random() * 2;
      const node = playNote(note, time, duration);
      nodes.push(node);
      time += 1.5 + Math.random() * 3;
    }

    // Loop: repetir o padrão
    const totalDuration = time - now;
    const loopInterval = setInterval(() => {
      if (this.activeAmbient !== 'piano') {
        clearInterval(loopInterval);
        return;
      }
      let t = this.ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const duration = 1 + Math.random() * 2;
        const node = playNote(note, t, duration);
        nodes.push(node);
        t += 1.5 + Math.random() * 3;
      }
    }, totalDuration * 1000);

    // Guardar para cleanup
    this._pianoInterval = loopInterval;
    this.ambientNodes = nodes;
  }

  /**
   * Lofi - batida suave com ruído
   */
  _createLofi() {
    const now = this.ctx.currentTime;
    
    // Bumbo suave
    const kickFreq = 80;
    const kickOsc = this.ctx.createOscillator();
    kickOsc.type = 'sine';
    kickOsc.frequency.value = kickFreq;

    const kickGain = this.ctx.createGain();
    kickGain.gain.setValueAtTime(0.2, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    // Caixa sutil (ruído)
    const snareBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const snareData = snareBuffer.getChannelData(0);
    for (let i = 0; i < snareData.length; i++) {
      snareData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snareData.length * 0.2));
    }

    const snareSource = this.ctx.createBufferSource();
    snareSource.buffer = snareBuffer;

    const snareFilter = this.ctx.createBiquadFilter();
    snareFilter.type = 'highpass';
    snareFilter.frequency.value = 1000;

    const snareGain = this.ctx.createGain();
    snareGain.gain.value = 0.1;

    // Ruído de fundo (chiado de vinil)
    const vinylBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const vinylData = vinylBuffer.getChannelData(0);
    for (let i = 0; i < vinylData.length; i++) {
      vinylData[i] = (Math.random() * 2 - 1) * 0.03;
    }

    const vinylSource = this.ctx.createBufferSource();
    vinylSource.buffer = vinylBuffer;
    vinylSource.loop = true;

    const vinylFilter = this.ctx.createBiquadFilter();
    vinylFilter.type = 'highpass';
    vinylFilter.frequency.value = 3000;

    const vinylGain = this.ctx.createGain();
    vinylGain.gain.value = 0.15;

    // Lo-fi pad (acorde suave)
    const padOsc1 = this.ctx.createOscillator();
    padOsc1.type = 'sawtooth';
    padOsc1.frequency.value = 220; // A3

    const padOsc2 = this.ctx.createOscillator();
    padOsc2.type = 'sawtooth';
    padOsc2.frequency.value = 330; // E4

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 400;

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.06;

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.3;

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);

    snareSource.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(masterGain);

    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(masterGain);

    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(masterGain);

    masterGain.connect(this.musicGain);

    // Schedule loop da batida
    const playKick = (t) => {
      const kOsc = this.ctx.createOscillator();
      kOsc.type = 'sine';
      kOsc.frequency.value = 80;
      const kGain = this.ctx.createGain();
      kGain.gain.setValueAtTime(0.15, t);
      kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      kOsc.connect(kGain);
      kGain.connect(masterGain);
      kOsc.start(t);
      kOsc.stop(t + 0.3);
      return kOsc;
    };

    const playSnare = (t) => {
      const sBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const sData = sBuffer.getChannelData(0);
      for (let i = 0; i < sData.length; i++) {
        sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sData.length * 0.15));
      }
      const sSource = this.ctx.createBufferSource();
      sSource.buffer = sBuffer;
      const sFilter = this.ctx.createBiquadFilter();
      sFilter.type = 'highpass';
      sFilter.frequency.value = 1000;
      const sGain = this.ctx.createGain();
      sGain.gain.value = 0.08;
      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(masterGain);
      sSource.start(t);
      return sSource;
    };

    const bpm = 70;
    const beatDuration = 60 / bpm;
    const nodes = [kickOsc, snareSource, vinylSource, padOsc1, padOsc2];

    // Tocar alguns compassos
    for (let i = 0; i < 16; i++) {
      const t = now + i * beatDuration;
      if (i % 2 === 0) {
        nodes.push(playKick(t));
      }
      if (i % 4 === 2) {
        nodes.push(playSnare(t));
      }
    }

    padOsc1.start(now);
    padOsc2.start(now);
    vinylSource.start(now);

    // Loop da batida
    const loopDuration = 16 * beatDuration;
    const beatInterval = setInterval(() => {
      if (this.activeAmbient !== 'lofi') {
        clearInterval(beatInterval);
        return;
      }
      const t = this.ctx.currentTime;
      for (let i = 0; i < 16; i++) {
        const beatT = t + i * beatDuration;
        if (i % 2 === 0) {
          nodes.push(playKick(beatT));
        }
        if (i % 4 === 2) {
          nodes.push(playSnare(beatT));
        }
      }
    }, loopDuration * 1000);

    this._lofiInterval = beatInterval;
    this.ambientNodes = nodes;
  }

  /**
   * Vento - ruído filtrado e modulado
   */
  _createWind() {
    const now = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const mod = 0.3 + 0.7 * Math.sin(i / (this.ctx.sampleRate * 1.5));
      data[i] = (Math.random() * 2 - 1) * mod;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;

    // LFO para modular a frequência do filtro (som de vento uivando)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    lfo.type = 'sine';

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 300;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.2;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(now);
    lfo.start(now);

    this.ambientNodes = [source, lfo];
  }

  /**
   * Lareira - ruído crepitante
   */
  _createFireplace() {
    const now = this.ctx.currentTime;
    
    // Ruído crepitante (sons curtos e aleatórios)
    const crackle = () => {
      const duration = 0.05 + Math.random() * 0.1;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3)) * 0.5;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 200 + Math.random() * 400;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.05 + Math.random() * 0.1;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      source.start(this.ctx.currentTime);
      return source;
    };

    // Ruído base (fogo contínuo)
    const fireBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const fireData = fireBuffer.getChannelData(0);
    for (let i = 0; i < fireData.length; i++) {
      fireData[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const fireSource = this.ctx.createBufferSource();
    fireSource.buffer = fireBuffer;
    fireSource.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 600;

    const fireGain = this.ctx.createGain();
    fireGain.gain.value = 0.15;

    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(this.musicGain);

    fireSource.start(now);

    // Crepitar aleatório
    const nodes = [fireSource];
    const crackleInterval = setInterval(() => {
      if (this.activeAmbient !== 'fireplace') {
        clearInterval(crackleInterval);
        return;
      }
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (this.activeAmbient === 'fireplace') {
            nodes.push(crackle());
          }
        }, Math.random() * 200);
      }
    }, 500);

    this._fireplaceInterval = crackleInterval;
    this.ambientNodes = nodes;
  }

  // ============================================================
  // CONTROLE DE VOLUME
  // ============================================================

  /**
   * Atualiza o volume da música ambiente
   */
  setMusicVolume(value) {
    this.settings.musicVolume = value;
    if (this.musicGain) {
      this.musicGain.gain.value = value;
    }
  }

  /**
   * Atualiza o volume dos efeitos sonoros
   */
  setEffectsVolume(value) {
    this.settings.effectsVolume = value;
    if (this.effectsGain) {
      this.effectsGain.gain.value = value;
    }
  }

  /**
   * Ativa/desativa os sons
   */
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  /**
   * Verifica se o áudio está pronto
   */
  isReady() {
    return this.isInitialized && this.ctx && this.settings.enabled;
  }

  /**
   * Libera recursos
   */
  destroy() {
    this.stopAmbient();
    if (this._pianoInterval) clearInterval(this._pianoInterval);
    if (this._lofiInterval) clearInterval(this._lofiInterval);
    if (this._fireplaceInterval) clearInterval(this._fireplaceInterval);
    if (this.ctx) {
      this.ctx.close();
    }
    this.isInitialized = false;
  }
}

// Singleton
export const audioManager = new AudioManager();
