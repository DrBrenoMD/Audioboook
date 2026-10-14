import { WordTimestamp, TranscriptionSegment, LookaheadBufferState } from '../types/audiobook';
import { audioEngine } from './audioEngine';
import { transcribeAudioChunk } from './whisperClient';

export interface LookaheadListener {
  onWordsUpdated: (allWords: WordTimestamp[], segments: TranscriptionSegment[]) => void;
  onBufferStateChanged: (state: LookaheadBufferState) => void;
}

export class LookaheadManager {
  private words: WordTimestamp[] = [];
  private segments: TranscriptionSegment[] = [];
  private transcribedUpTo = 0; // in seconds
  private lookaheadWindow = 12; // 10 to 15 seconds ahead
  private isProcessingChunk = false;
  private isPreloaded = false;
  private totalDuration = 0;
  private activeEngine: import('../types/audiobook').TranscriptionEngine = 'whisper-webgpu';
  private listeners: LookaheadListener[] = [];

  constructor(lookaheadWindow = 12) {
    this.lookaheadWindow = lookaheadWindow;
  }

  public subscribe(listener: LookaheadListener) {
    this.listeners.push(listener);
    // Send current state immediately
    listener.onWordsUpdated(this.words, this.segments);
    listener.onBufferStateChanged(this.getBufferState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l.onWordsUpdated(this.words, this.segments);
      l.onBufferStateChanged(this.getBufferState());
    }
  }

  public getBufferState(): LookaheadBufferState {
    return {
      isBuffering: this.isProcessingChunk,
      transcribedUpTo: this.transcribedUpTo,
      lookaheadWindow: this.lookaheadWindow,
      activeEngine: this.activeEngine,
      queueStatus: this.isProcessingChunk
        ? 'transcribing'
        : this.transcribedUpTo >= this.totalDuration && this.totalDuration > 0
        ? 'completed'
        : 'idle',
    };
  }

  /**
   * Reset the lookahead buffer for a new audiobook
   */
  public reset(duration: number, preloadedSegments?: TranscriptionSegment[]) {
    this.totalDuration = duration;
    this.isProcessingChunk = false;

    if (preloadedSegments && preloadedSegments.length > 0) {
      this.isPreloaded = true;
      this.segments = [...preloadedSegments];
      this.words = preloadedSegments.flatMap((s) => s.words);
      const lastWord = this.words[this.words.length - 1];
      this.transcribedUpTo = lastWord ? lastWord.end : duration;
    } else {
      this.isPreloaded = false;
      this.segments = [];
      this.words = [];
      this.transcribedUpTo = 0;
    }

    this.notify();
  }

  /**
   * Called during audio playback on every tick/timeupdate
   */
  public async onPlaybackTick(currentTime: number, audioFormat: 'mp3' | 'm4a' = 'mp3', language = 'pt') {
    // If preloaded demo, already has words; check lookahead buffer presentation
    if (this.isPreloaded) {
      return;
    }

    // Check if we need to transcribe ahead
    const targetBufferTime = Math.min(this.totalDuration, currentTime + this.lookaheadWindow);

    if (targetBufferTime > this.transcribedUpTo && !this.isProcessingChunk) {
      await this.transcribeNextSlice(this.transcribedUpTo, targetBufferTime, audioFormat, language);
    }
  }

  /**
   * Slice and transcribe next audio segment
   */
  private async transcribeNextSlice(
    startSec: number,
    targetEndSec: number,
    format: 'mp3' | 'm4a',
    language: string
  ) {
    if (this.isProcessingChunk) return;
    this.isProcessingChunk = true;
    this.notify();

    const sliceDuration = Math.max(6, targetEndSec - startSec);

    try {
      // Extract 16kHz PCM audio slice directly via AudioEngine
      const pcmData = audioEngine.extractAudioSlicePCM(startSec, sliceDuration);

      if (pcmData && pcmData.length > 0) {
        const result = await transcribeAudioChunk(
          pcmData,
          startSec,
          sliceDuration,
          undefined,
          language
        );

        if (result.words && result.words.length > 0) {
          this.mergeWords(result.words, result.text, startSec, startSec + sliceDuration);
          this.activeEngine = result.engineUsed;
        }
      }

      this.transcribedUpTo = Math.max(this.transcribedUpTo, startSec + sliceDuration);
    } catch (err) {
      console.error('Error during lookahead slice transcription:', err);
      this.transcribedUpTo = Math.max(this.transcribedUpTo, startSec + 4);
    } finally {
      this.isProcessingChunk = false;
      this.notify();
    }
  }

  private mergeWords(newWords: WordTimestamp[], text: string, start: number, end: number) {
    // Filter out duplicates by timestamp
    const existingIds = new Set(this.words.map((w) => w.id));
    const addedWords = newWords.filter((w) => !existingIds.has(w.id));

    this.words = [...this.words, ...addedWords].sort((a, b) => a.start - b.start);

    // Group into segments
    this.segments.push({
      id: `seg_${start.toFixed(1)}_${end.toFixed(1)}`,
      start,
      end,
      text,
      words: addedWords,
    });

    this.notify();
  }

  public getWords(): WordTimestamp[] {
    return this.words;
  }

  public getSegments(): TranscriptionSegment[] {
    return this.segments;
  }
}

export const lookaheadManager = new LookaheadManager(12);
