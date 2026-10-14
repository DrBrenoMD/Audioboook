import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Initialize Google Gemini Client with User-Agent
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    primaryEngine: 'gemini-3.5-transcribe',
    timestamp: new Date().toISOString(),
  });
});

// Engine information endpoint
app.get('/api/engine-info', (req, res) => {
  res.json({
    defaultEngine: 'gemini-cloud',
    primaryModel: 'gemini-3.5-transcribe',
    fallbackModel: 'gemini-3.8-flash',
    localFallback: 'whisper-webgpu',
    hasGeminiKey: Boolean(apiKey),
  });
});

// Transcribe audio chunk with Gemini API (Default Engine)
app.post('/api/transcribe-chunk', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', chunkStart = 0, duration = 12, language = 'pt' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!aiClient) {
      return res.json({
        text: '',
        words: [],
        fallbackToLocal: true,
        reason: 'GEMINI_API_KEY not configured',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType.includes('m4a') ? 'audio/mp4' : mimeType.includes('mp3') ? 'audio/mp3' : 'audio/wav',
        data: audioBase64,
      },
    };

    const promptText = `Transcribe this short excerpt of an audiobook spoken in ${language === 'pt' ? 'Portuguese' : 'English'}.
Listen carefully and output the transcription along with start and end timestamps in seconds relative to the audio chunk (from 0.0s to ~${duration.toFixed(1)}s).
Output strictly in JSON format matching the schema.`;

    const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let successfulModel: string | null = null;
    let parsed: any = null;

    for (const model of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: {
            parts: [
              audioPart,
              { text: promptText },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: 'Exact transcribed text of this spoken audio segment',
                },
                words: {
                  type: Type.ARRAY,
                  description: 'List of individual transcribed words with start and end seconds',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      start: { type: Type.NUMBER, description: 'Start time relative to chunk in seconds (e.g. 0.45)' },
                      end: { type: Type.NUMBER, description: 'End time relative to chunk in seconds (e.g. 0.90)' },
                    },
                    required: ['word', 'start', 'end'],
                  },
                },
              },
              required: ['text', 'words'],
            },
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          parsed = JSON.parse(textOutput);
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} transcription attempt returned status ${err?.status || err?.message || 'error'}`);
      }
    }

    if (!parsed) {
      // If temporary 503 high demand on all cloud models, smoothly signal client to use local Whisper
      console.warn('Gemini cloud models busy or returned error, signaling client to use local Whisper');
      return res.json({
        text: '',
        words: [],
        fallbackToLocal: true,
        engineUsed: 'gemini-cloud-busy',
      });
    }

    const baseOffset = typeof chunkStart === 'number' ? chunkStart : 0;
    const words = (parsed.words || []).map((w: { word: string; start: number; end: number }, idx: number) => ({
      id: `w_gem_${Math.round((baseOffset + w.start) * 1000)}_${idx}`,
      word: (w.word || '').trim(),
      start: parseFloat((baseOffset + (w.start || 0)).toFixed(2)),
      end: parseFloat((baseOffset + (w.end || (w.start + 0.35))).toFixed(2)),
    })).filter((w: { word: string }) => Boolean(w.word));

    return res.json({
      text: parsed.text || '',
      words,
      engineUsed: successfulModel,
      chunkStart: baseOffset,
    });
  } catch (error: any) {
    console.error('Fatal error in /api/transcribe-chunk:', error?.message || error);
    return res.json({
      text: '',
      words: [],
      fallbackToLocal: true,
      error: error?.message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`VoxLibris server running on http://0.0.0.0:${PORT} (Default Engine: Gemini Cloud)`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
