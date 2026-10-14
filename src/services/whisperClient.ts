import { WordTimestamp, TranscriptionEngine } from '../types/audiobook';

let whisperPipeline: any = null;
let isModelLoading = false;
let modelLoadProgress = 0;
let modelStatusListeners: ((status: { isLoading: boolean; progress: number; message: string }) => void)[] = [];

export interface TranscriptionResult {
  text: string;
  words: WordTimestamp[];
  engineUsed: TranscriptionEngine;
}

export function subscribeModelStatus(listener: (status: { isLoading: boolean; progress: number; message: string }) => void) {
  modelStatusListeners.push(listener);
  listener({
    isLoading: isModelLoading,
    progress: modelLoadProgress,
    message: isModelLoading ? `Carregando Whisper WebGPU (${modelLoadProgress}%)...` : 'Whisper pronto',
  });
  return () => {
    modelStatusListeners = modelStatusListeners.filter((l) => l !== listener);
  };
}

function broadcastModelStatus(isLoading: boolean, progress: number, message: string) {
  isModelLoading = isLoading;
  modelLoadProgress = progress;
  for (const listener of modelStatusListeners) {
    listener({ isLoading, progress, message });
  }
}

/**
 * Check if the browser supports WebGPU
 */
export async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !(navigator as any).gpu) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

/**
 * Initialize Whisper WebGPU/WASM pipeline in-browser
 */
export async function initWhisperPipeline(): Promise<any> {
  if (whisperPipeline) return whisperPipeline;
  if (isModelLoading) return null;

  broadcastModelStatus(true, 10, 'Iniciando Whisper WebGPU local...');

  try {
    const { pipeline } = await import('@huggingface/transformers');
    const hasWebGPU = await checkWebGPUSupport();
    const device = hasWebGPU ? 'webgpu' : 'wasm';

    broadcastModelStatus(true, 25, `Carregando pesos ONNX no dispositivo (${device.toUpperCase()})...`);

    whisperPipeline = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
      device,
      dtype: 'fp32',
      progress_callback: (item: any) => {
        if (item.status === 'progress' && typeof item.progress === 'number') {
          const pct = Math.round(item.progress);
          broadcastModelStatus(true, pct, `Baixando modelo Whisper (${pct}%)...`);
        }
      },
    });

    broadcastModelStatus(false, 100, 'Whisper WebGPU pronto para transcrição');
    return whisperPipeline;
  } catch (err: any) {
    console.error('Erro na inicialização do Whisper local:', err);
    broadcastModelStatus(false, 0, 'Erro ao carregar modelo Whisper');
    return null;
  }
}

/**
 * Transcribe an audio slice (Float32Array at 16kHz) strictly using local in-browser Whisper
 */
export async function transcribeAudioChunk(
  audioPCM: Float32Array,
  chunkStart: number,
  chunkDuration: number,
  _ignoredEngine?: any,
  language?: string
): Promise<TranscriptionResult> {
  const hasWebGPU = await checkWebGPUSupport();
  const engineUsed: TranscriptionEngine = hasWebGPU ? 'whisper-webgpu' : 'whisper-wasm';

  // Check if audio has energy (not pure silence)
  let sumSquares = 0;
  for (let i = 0; i < audioPCM.length; i++) {
    sumSquares += audioPCM[i] * audioPCM[i];
  }
  const rms = Math.sqrt(sumSquares / audioPCM.length);
  if (rms < 0.003) {
    // Silence or background pause
    return {
      text: '',
      words: [],
      engineUsed,
    };
  }

  try {
    const pipe = await initWhisperPipeline();
    if (!pipe) {
      console.warn('Whisper pipeline still preparing or not available');
      return {
        text: '',
        words: [],
        engineUsed,
      };
    }

    // Call whisper pipeline with return_timestamps: true
    const pipeOptions: any = {
      return_timestamps: true,
      chunk_length_s: 30,
    };
    if (language && language !== 'auto') {
      pipeOptions.language = language.toLowerCase().includes('pt') ? 'portuguese' : 'english';
    }

    const output = await pipe(audioPCM, pipeOptions);
    const text = (output?.text || '').trim();
    const rawChunks = output?.chunks || [];

    const words: WordTimestamp[] = [];

    if (rawChunks.length > 0) {
      for (let cIdx = 0; cIdx < rawChunks.length; cIdx++) {
        const chunk = rawChunks[cIdx];
        const rawChunkText = (chunk.text || '').trim();
        if (!rawChunkText) continue;

        const cStartRel = chunk.timestamp?.[0] ?? 0;
        const cEndRel = chunk.timestamp?.[1] ?? (cStartRel + 1.2);

        const cStartAbs = parseFloat((chunkStart + cStartRel).toFixed(2));
        const cEndAbs = parseFloat((chunkStart + cEndRel).toFixed(2));

        const tokens = rawChunkText.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) continue;

        const wordDuration = Math.max(0.15, (cEndAbs - cStartAbs) / tokens.length);

        for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
          const wStart = parseFloat((cStartAbs + tIdx * wordDuration).toFixed(2));
          const wEnd = parseFloat((cStartAbs + (tIdx + 1) * wordDuration).toFixed(2));

          words.push({
            id: `w_${Math.round(wStart * 1000)}_${cIdx}_${tIdx}`,
            word: tokens[tIdx],
            start: wStart,
            end: wEnd,
          });
        }
      }
    } else if (text) {
      // Fallback: If chunks was empty but text was recognized
      const tokens = text.split(/\s+/).filter(Boolean);
      const wordDuration = Math.max(0.2, chunkDuration / tokens.length);
      for (let i = 0; i < tokens.length; i++) {
        const wStart = parseFloat((chunkStart + i * wordDuration).toFixed(2));
        const wEnd = parseFloat((chunkStart + (i + 1) * wordDuration).toFixed(2));
        words.push({
          id: `w_${Math.round(wStart * 1000)}_${i}`,
          word: tokens[i],
          start: wStart,
          end: wEnd,
        });
      }
    }

    return {
      text,
      words,
      engineUsed,
    };
  } catch (err: any) {
    console.error('Falha na inferência do Whisper local:', err?.message || err);
    return {
      text: '',
      words: [],
      engineUsed,
    };
  }
}
