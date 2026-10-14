/**
 * Audio Engine: Manages HTML5 audio playback, Web Audio API decoding for MP3/M4A,
 * audio slicing for lookahead buffering, speech synthesis for demo books, and waveform generation.
 */

class AudioEngine {
  private audioEl: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private decodedBuffer: AudioBuffer | null = null;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private isDemoMode = false;
  private demoSegmentsText = '';
  private demoLanguage = 'pt-BR';
  private demoStartTime = 0;
  private demoPausedTime = 0;
  private demoPlaybackRate = 1;
  private demoTimer: number | null = null;
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;

  constructor() {
    this.audioEl = new Audio();
    this.setupAudioListeners();
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private setupAudioListeners() {
    if (!this.audioEl) return;

    this.audioEl.addEventListener('timeupdate', () => {
      if (!this.isDemoMode && this.onTimeUpdateCallback && this.audioEl) {
        this.onTimeUpdateCallback(this.audioEl.currentTime);
      }
    });

    this.audioEl.addEventListener('ended', () => {
      if (!this.isDemoMode && this.onEndedCallback) {
        this.onEndedCallback();
      }
    });
  }

  public setCallbacks(
    onTimeUpdate: (time: number) => void,
    onEnded: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
  }

  /**
   * Load an uploaded audio file (MP3 or M4A)
   */
  public async loadUserAudioFile(file: File): Promise<{ duration: number; waveform: number[] }> {
    this.stop();
    this.isDemoMode = false;
    this.decodedBuffer = null;

    const objectUrl = URL.createObjectURL(file);
    if (!this.audioEl) {
      this.audioEl = new Audio();
      this.setupAudioListeners();
    }

    this.audioEl.src = objectUrl;

    // Decode with Web Audio API to get precise PCM buffer for lookahead slicing & waveform
    const arrayBuffer = await file.arrayBuffer();
    const ctx = this.getAudioContext();
    try {
      this.decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch (err) {
      console.warn('Direct decodeAudioData failed, relying on HTML5 Audio decoding:', err);
    }

    const duration = await new Promise<number>((resolve) => {
      if (!this.audioEl) return resolve(0);
      if (this.audioEl.duration && !isNaN(this.audioEl.duration)) {
        resolve(this.audioEl.duration);
      } else {
        const handler = () => {
          this.audioEl?.removeEventListener('loadedmetadata', handler);
          resolve(this.audioEl?.duration || 0);
        };
        this.audioEl.addEventListener('loadedmetadata', handler);
      }
    });

    const waveform = this.decodedBuffer
      ? this.extractWaveform(this.decodedBuffer, 120)
      : this.generateSyntheticWaveform(120);

    return { duration: duration || (this.decodedBuffer?.duration ?? 0), waveform };
  }

  /**
   * Setup synthetic demo audio book (with speech synthesis + organic tones)
   */
  public setupDemoAudio(fullText: string, duration: number, language = 'pt-BR'): number[] {
    this.stop();
    this.isDemoMode = true;
    this.demoSegmentsText = fullText;
    this.demoLanguage = language;
    this.demoPausedTime = 0;
    this.decodedBuffer = null;

    return this.generateSyntheticWaveform(120);
  }

  /**
   * Play audio
   */
  public async play(): Promise<void> {
    if (this.isDemoMode) {
      this.playDemo();
      return;
    }

    if (this.audioEl) {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      await this.audioEl.play();
    }
  }

  /**
   * Pause audio
   */
  public pause(): void {
    if (this.isDemoMode) {
      this.pauseDemo();
      return;
    }

    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  /**
   * Seek to specific timestamp in seconds
   */
  public seek(seconds: number): void {
    if (this.isDemoMode) {
      this.seekDemo(seconds);
      return;
    }

    if (this.audioEl) {
      this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.audioEl.duration || seconds));
    }
  }

  /**
   * Set playback rate (e.g. 0.75, 1.0, 1.25, 1.5, 2.0)
   */
  public setPlaybackRate(rate: number): void {
    this.demoPlaybackRate = rate;
    if (this.audioEl) {
      this.audioEl.playbackRate = rate;
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    if (this.audioEl) {
      this.audioEl.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Stop all playback
   */
  public stop(): void {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    if (this.isDemoMode) {
      this.pauseDemo();
      this.demoPausedTime = 0;
    }
  }

  public getCurrentTime(): number {
    if (this.isDemoMode) {
      return this.demoPausedTime;
    }
    return this.audioEl?.currentTime || 0;
  }

  public getDuration(): number {
    if (this.isDemoMode) {
      return 120; // default duration for demo chapters
    }
    return this.audioEl?.duration || this.decodedBuffer?.duration || 0;
  }

  /**
   * Extract audio slice (e.g. 10 to 15 seconds) from decoded PCM buffer as 16kHz mono WAV base64
   */
  public extractAudioSliceWavBase64(startSec: number, durationSec: number): string | null {
    if (!this.decodedBuffer) return null;

    const sampleRate = this.decodedBuffer.sampleRate;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.min(
      this.decodedBuffer.length,
      Math.floor((startSec + durationSec) * sampleRate)
    );

    if (startSample >= endSample) return null;

    const sliceLength = endSample - startSample;
    const channelData = this.decodedBuffer.getChannelData(0);

    // Resample down to 16000Hz for speech recognition efficiency
    const targetSampleRate = 16000;
    const resampleRatio = targetSampleRate / sampleRate;
    const targetLength = Math.round(sliceLength * resampleRatio);
    const resampledData = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const origIndex = startSample + Math.floor(i / resampleRatio);
      resampledData[i] = channelData[origIndex] || 0;
    }

    // Convert to 16-bit PCM WAV
    const wavBuffer = this.encodeWAV(resampledData, targetSampleRate);
    return this.arrayBufferToBase64(wavBuffer);
  }

  /**
   * Encode Float32Array to 16-bit PCM WAV ArrayBuffer
   */
  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    /* RIFF identifier */
    writeString(0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(8, 'WAVE');
    /* format chunk identifier */
    writeString(12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count (mono) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    // Write the 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private extractWaveform(audioBuffer: AudioBuffer, numBars: number): number[] {
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / numBars);
    const waveform: number[] = [];

    for (let i = 0; i < numBars; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j]);
      }
      const avg = sum / blockSize;
      waveform.push(Math.min(1, Math.max(0.15, avg * 3.5)));
    }
    return waveform;
  }

  private generateSyntheticWaveform(numBars: number): number[] {
    const bars: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const wave = Math.sin(i * 0.2) * 0.3 + Math.cos(i * 0.08) * 0.2 + 0.5;
      bars.push(Math.min(1, Math.max(0.15, wave)));
    }
    return bars;
  }

  // --- Demo Mode Speech Simulation / Synchronizer ---
  private playDemo() {
    this.demoStartTime = performance.now() - (this.demoPausedTime * 1000) / this.demoPlaybackRate;

    // Use Web Speech API if supported for real speech audio!
    if ('speechSynthesis' in window && this.demoPausedTime === 0) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(this.demoSegmentsText);
        utterance.lang = this.demoLanguage;
        utterance.rate = this.demoPlaybackRate;
        this.speechUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    if (this.demoTimer) cancelAnimationFrame(this.demoTimer);

    const step = () => {
      const elapsed = (performance.now() - this.demoStartTime) / 1000 * this.demoPlaybackRate;
      this.demoPausedTime = elapsed;

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(elapsed);
      }

      this.demoTimer = requestAnimationFrame(step);
    };

    this.demoTimer = requestAnimationFrame(step);
  }

  private pauseDemo() {
    if (this.demoTimer) {
      cancelAnimationFrame(this.demoTimer);
      this.demoTimer = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private seekDemo(seconds: number) {
    this.demoPausedTime = seconds;
    this.demoStartTime = performance.now() - (seconds * 1000) / this.demoPlaybackRate;
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(seconds);
    }
  }
}

export const audioEngine = new AudioEngine();
