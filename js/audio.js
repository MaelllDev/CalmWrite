/* ============================================================
   CALMWRITE - Audio Module
   ============================================================
   Geração de sons de navegação e música ambiente usando
   Web Audio API. Sem dependências de arquivos externos.
   ============================================================ */

window.CalmWrite = window.CalmWrite || {};

(function() {
  'use strict';

  function AudioManager() {
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
    };
  }

  AudioManager.prototype.init = function() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
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
  };

  AudioManager.prototype.resume = function() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  };

  AudioManager.prototype.playPaperSound = function() {
    if (!this.isReady()) return;
    this.resume();
    
    var now = this.ctx.currentTime;
    var duration = 0.15;

    var bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;

    var filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    source.start(now);
    source.stop(now + duration);
  };

  AudioManager.prototype.playClickSound = function() {
    if (!this.isReady()) return;
    this.resume();

    var now = this.ctx.currentTime;
    var duration = 0.05;

    var osc = this.ctx.createOscillator();
    osc.frequency.value = 1200;
    osc.type = 'sine';

    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.effectsGain);

    osc.start(now);
    osc.stop(now + duration);
  };

  AudioManager.prototype.playTypewriterSound = function() {
    if (!this.isReady()) return;
    this.resume();

    var now = this.ctx.currentTime;
    var duration = 0.08;

    var bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;

    var filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;

    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain);

    source.start(now);
    source.stop(now + duration);
  };

  AudioManager.prototype.playNavSound = function(type) {
    type = type || 'paper';
    if (!this.settings.enabled) return;
    switch (type) {
      case 'paper': this.playPaperSound(); break;
      case 'click': this.playClickSound(); break;
      case 'typewriter': this.playTypewriterSound(); break;
      default: this.playPaperSound();
    }
  };

  AudioManager.prototype.startAmbient = function(type) {
    if (!this.isReady()) return;
    this.resume();
    this.stopAmbient();
    
    // Parar Spotify se estiver tocando
    if (window.CalmWrite && CalmWrite.spotifyManager) {
      CalmWrite.spotifyManager.clear();
      var miniPlayer = document.getElementById('spotify-mini-player');
      if (miniPlayer) miniPlayer.classList.add('mini-player--hidden');
    }
    
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
  };

  AudioManager.prototype.stopAmbient = function() {
    for (var i = 0; i < this.ambientNodes.length; i++) {
      try {
        var node = this.ambientNodes[i];
        if (node && typeof node.stop === 'function') node.stop();
        if (node && typeof node.disconnect === 'function') node.disconnect();
      } catch (e) { /* ignore */ }
    }
    this.ambientNodes = [];
    this.activeAmbient = null;
  };

  AudioManager.prototype.isPlaying = function() {
    return this.activeAmbient !== null;
  };

  AudioManager.prototype.toggleAmbient = function(type) {
    if (this.activeAmbient === type) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient(type);
      return true;
    }
  };

  AudioManager.prototype.setMusicVolume = function(value) {
    this.settings.musicVolume = value;
    if (this.musicGain) {
      this.musicGain.gain.value = value;
    }
  };

  AudioManager.prototype.setEffectsVolume = function(value) {
    this.settings.effectsVolume = value;
    if (this.effectsGain) {
      this.effectsGain.gain.value = value;
    }
  };

  AudioManager.prototype.setEnabled = function(enabled) {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  };

  AudioManager.prototype.isReady = function() {
    return this.isInitialized && this.ctx && this.settings.enabled;
  };

  AudioManager.prototype.destroy = function() {
    this.stopAmbient();
    if (this._pianoInterval) clearInterval(this._pianoInterval);
    if (this._lofiInterval) clearInterval(this._lofiInterval);
    if (this._fireplaceInterval) clearInterval(this._fireplaceInterval);
    if (this.ctx) {
      this.ctx.close();
    }
    this.isInitialized = false;
  };

  // ============================================================
  // AMBIENT SOUND GENERATORS (abreviados para brevidade)
  // ============================================================

  AudioManager.prototype._createRain = function() {
    var now = this.ctx.currentTime;
    var bufferSize = Math.ceil(this.ctx.sampleRate * 2);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'highpass';
    filter1.frequency.value = 500;

    var filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 3000;

    var lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.3;
    lfo.type = 'sine';
    var lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;

    var gainNode = this.ctx.createGain();
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
  };

  AudioManager.prototype._createForest = function() {
    var now = this.ctx.currentTime;
    var bufferSize = Math.ceil(this.ctx.sampleRate * 3);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    var birdOsc = this.ctx.createOscillator();
    birdOsc.type = 'sine';
    birdOsc.frequency.value = 2000;
    var birdModGain = this.ctx.createGain();
    birdModGain.gain.value = 0.02;

    var mainGain = this.ctx.createGain();
    mainGain.gain.value = 0.2;

    source.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.musicGain);
    birdOsc.connect(birdModGain);
    birdModGain.connect(this.musicGain);

    source.start(now);
    birdOsc.start(now);
    this.ambientNodes = [source, birdOsc];
  };

  AudioManager.prototype._createLibrary = function() {
    var now = this.ctx.currentTime;
    var bufferSize = Math.ceil(this.ctx.sampleRate * 2);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1;

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    var gain = this.ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    source.start(now);
    this.ambientNodes = [source];
  };

  AudioManager.prototype._createCafe = function() {
    var now = this.ctx.currentTime;
    var bufferSize = Math.ceil(this.ctx.sampleRate * 4);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var mod = 0.5 + 0.5 * Math.sin(i / (this.ctx.sampleRate * 2));
      data[i] = (Math.random() * 2 - 1) * 0.2 * mod;
    }

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'highpass';
    filter1.frequency.value = 400;
    var filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 2000;
    var gain = this.ctx.createGain();
    gain.gain.value = 0.12;

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.musicGain);
    source.start(now);
    this.ambientNodes = [source];
  };

  AudioManager.prototype._createPiano = function() {
    var self = this;
    var now = this.ctx.currentTime;
    var notes = [262, 294, 330, 349, 392, 440, 494, 523];
    var nodes = [];

    function playNote(freq, startTime, duration) {
      var osc = self.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var gain = self.ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(self.musicGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
      return osc;
    }

    var time = now;
    for (var i = 0; i < 12; i++) {
      var note = notes[Math.floor(Math.random() * notes.length)];
      var duration = 1 + Math.random() * 2;
      nodes.push(playNote(note, time, duration));
      time += 1.5 + Math.random() * 3;
    }

    var totalDuration = time - now;
    this._pianoInterval = setInterval(function() {
      if (self.activeAmbient !== 'piano') {
        clearInterval(self._pianoInterval);
        return;
      }
      var t = self.ctx.currentTime;
      for (var i = 0; i < 8; i++) {
        var note = notes[Math.floor(Math.random() * notes.length)];
        var duration = 1 + Math.random() * 2;
        nodes.push(playNote(note, t, duration));
        t += 1.5 + Math.random() * 3;
      }
    }, totalDuration * 1000);

    this.ambientNodes = nodes;
  };

  AudioManager.prototype._createLofi = function() {
    var self = this;
    var now = this.ctx.currentTime;
    var bpm = 70;
    var beatDuration = 60 / bpm;
    var nodes = [];

    var masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(this.musicGain);

    // Vinyl noise
    var vinylBuffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * 2), this.ctx.sampleRate);
    var vinylData = vinylBuffer.getChannelData(0);
    for (var i = 0; i < vinylData.length; i++) vinylData[i] = (Math.random() * 2 - 1) * 0.03;
    var vinylSource = this.ctx.createBufferSource();
    vinylSource.buffer = vinylBuffer;
    vinylSource.loop = true;
    var vinylFilter = this.ctx.createBiquadFilter();
    vinylFilter.type = 'highpass';
    vinylFilter.frequency.value = 3000;
    var vinylGain = this.ctx.createGain();
    vinylGain.gain.value = 0.15;
    vinylSource.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(masterGain);
    vinylSource.start(now);
    nodes.push(vinylSource);

    // Pad
    var padOsc1 = this.ctx.createOscillator();
    padOsc1.type = 'sawtooth';
    padOsc1.frequency.value = 220;
    var padOsc2 = this.ctx.createOscillator();
    padOsc2.type = 'sawtooth';
    padOsc2.frequency.value = 330;
    var padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 400;
    var padGain = this.ctx.createGain();
    padGain.gain.value = 0.06;
    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(masterGain);
    padOsc1.start(now);
    padOsc2.start(now);
    nodes.push(padOsc1, padOsc2);

    function playKick(t) {
      var kOsc = self.ctx.createOscillator();
      kOsc.type = 'sine';
      kOsc.frequency.value = 80;
      var kGain = self.ctx.createGain();
      kGain.gain.setValueAtTime(0.15, t);
      kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      kOsc.connect(kGain);
      kGain.connect(masterGain);
      kOsc.start(t);
      kOsc.stop(t + 0.3);
      return kOsc;
    }

    function playSnare(t) {
      var sBuffer = self.ctx.createBuffer(1, Math.ceil(self.ctx.sampleRate * 0.08), self.ctx.sampleRate);
      var sData = sBuffer.getChannelData(0);
      for (var i = 0; i < sData.length; i++) sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sData.length * 0.15));
      var sSource = self.ctx.createBufferSource();
      sSource.buffer = sBuffer;
      var sFilter = self.ctx.createBiquadFilter();
      sFilter.type = 'highpass';
      sFilter.frequency.value = 1000;
      var sGain = self.ctx.createGain();
      sGain.gain.value = 0.08;
      sSource.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(masterGain);
      sSource.start(t);
      return sSource;
    }

    for (var i = 0; i < 16; i++) {
      var t = now + i * beatDuration;
      if (i % 2 === 0) nodes.push(playKick(t));
      if (i % 4 === 2) nodes.push(playSnare(t));
    }

    var loopDuration = 16 * beatDuration;
    this._lofiInterval = setInterval(function() {
      if (self.activeAmbient !== 'lofi') {
        clearInterval(self._lofiInterval);
        return;
      }
      var t = self.ctx.currentTime;
      for (var i = 0; i < 16; i++) {
        var beatT = t + i * beatDuration;
        if (i % 2 === 0) nodes.push(playKick(beatT));
        if (i % 4 === 2) nodes.push(playSnare(beatT));
      }
    }, loopDuration * 1000);

    this.ambientNodes = nodes;
  };

  AudioManager.prototype._createWind = function() {
    var now = this.ctx.currentTime;
    var bufferSize = Math.ceil(this.ctx.sampleRate * 3);
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var mod = 0.3 + 0.7 * Math.sin(i / (this.ctx.sampleRate * 1.5));
      data[i] = (Math.random() * 2 - 1) * mod;
    }

    var source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;

    var lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    lfo.type = 'sine';
    var lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 300;
    var gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.2;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(now);
    lfo.start(now);
    this.ambientNodes = [source, lfo];
  };

  AudioManager.prototype._createFireplace = function() {
    var self = this;
    var now = this.ctx.currentTime;

    var fireBuffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * 2), this.ctx.sampleRate);
    var fireData = fireBuffer.getChannelData(0);
    for (var i = 0; i < fireData.length; i++) fireData[i] = (Math.random() * 2 - 1) * 0.15;

    var fireSource = this.ctx.createBufferSource();
    fireSource.buffer = fireBuffer;
    fireSource.loop = true;
    var fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 600;
    var fireGain = this.ctx.createGain();
    fireGain.gain.value = 0.15;
    fireSource.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(this.musicGain);
    fireSource.start(now);

    var nodes = [fireSource];
    this._fireplaceInterval = setInterval(function() {
      if (self.activeAmbient !== 'fireplace') {
        clearInterval(self._fireplaceInterval);
        return;
      }
      var count = Math.floor(Math.random() * 3) + 1;
      for (var i = 0; i < count; i++) {
        setTimeout(function() {
          if (self.activeAmbient === 'fireplace') {
            var duration = 0.05 + Math.random() * 0.1;
            var bufSize = Math.ceil(self.ctx.sampleRate * duration);
            var buf = self.ctx.createBuffer(1, bufSize, self.ctx.sampleRate);
            var d = buf.getChannelData(0);
            for (var j = 0; j < bufSize; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufSize * 0.3)) * 0.5;
            var src = self.ctx.createBufferSource();
            src.buffer = buf;
            var flt = self.ctx.createBiquadFilter();
            flt.type = 'bandpass';
            flt.frequency.value = 200 + Math.random() * 400;
            var gn = self.ctx.createGain();
            gn.gain.value = 0.05 + Math.random() * 0.1;
            src.connect(flt);
            flt.connect(gn);
            gn.connect(self.musicGain);
            src.start(self.ctx.currentTime);
            nodes.push(src);
          }
        }, Math.random() * 200);
      }
    }, 500);

    this.ambientNodes = nodes;
  };

  window.CalmWrite.AudioManager = AudioManager;
  window.CalmWrite.audioManager = new AudioManager();
})();
