export interface WordTimestamp {
  id: string;
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence?: number;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

export interface AudiobookItem {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  duration: number; // in seconds
  format: 'mp3' | 'm4a';
  audioUrl: string;
  isDemo?: boolean;
  coverTitle: string;
  coverAuthor: string;
  coverTheme: 'emerald' | 'burgundy' | 'indigo' | 'slate' | 'amber';
  preloadedSegments?: TranscriptionSegment[];
}

export type ReaderTheme = 'obsidian' | 'paper' | 'sepia';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type TranscriptionEngine = 'gemini-cloud' | 'whisper-webgpu' | 'whisper-wasm';

export interface LookaheadBufferState {
  isBuffering: boolean;
  transcribedUpTo: number; // seconds ahead of 0
  lookaheadWindow: number; // default 12s
  activeEngine: TranscriptionEngine;
  queueStatus: 'idle' | 'transcribing' | 'completed' | 'error';
  lastChunkTime?: number;
}
