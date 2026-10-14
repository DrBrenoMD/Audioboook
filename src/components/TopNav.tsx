import React from 'react';
import { BookOpen, Upload, Library, Download, Cpu, Globe, Zap } from 'lucide-react';
import { TranscriptionEngine } from '../types/audiobook';

interface TopNavProps {
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  onOpenExport: () => void;
  currentBookTitle?: string;
  hasWebGPU?: boolean;
  language?: 'auto' | 'pt' | 'en';
  onLanguageChange?: (lang: 'auto' | 'pt' | 'en') => void;
  engine?: TranscriptionEngine;
  onEngineChange?: (engine: TranscriptionEngine) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenUpload,
  onOpenLibrary,
  onOpenExport,
  currentBookTitle = 'Dom Casmurro',
  language = 'auto',
  onLanguageChange,
  engine = 'gemini-cloud',
  onEngineChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-stone-950/90 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-stone-950 font-serif font-bold text-lg shadow-inner">
            V
          </div>
          <span
            className="text-xl font-bold tracking-tight text-stone-100 whitespace-nowrap font-serif"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            VoxLibris
          </span>
          <span className="hidden sm:inline-block text-[11px] text-amber-500/80 font-mono tracking-widest uppercase">
            Karaoke Transcriber
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
          <button
            onClick={onOpenLibrary}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Library className="w-4 h-4 text-amber-500" />
            <span>Biblioteca</span>
          </button>

          <div className="flex items-center gap-1.5 text-stone-300 whitespace-nowrap shrink-0 max-w-xs truncate">
            <BookOpen className="w-4 h-4 text-stone-500 shrink-0" />
            <span className="text-xs text-stone-500">Tocando:</span>
            <span className="text-xs font-semibold text-stone-200 truncate">{currentBookTitle}</span>
          </div>

          {/* Engine Selector (Gemini Cloud Default vs Whisper Local) */}
          {onEngineChange && (
            <div className="flex items-center gap-1 p-0.5 rounded bg-stone-900 border border-stone-800 text-xs">
              <button
                onClick={() => onEngineChange('gemini-cloud')}
                className={`px-2 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  engine === 'gemini-cloud'
                    ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/50 shadow-sm shadow-amber-500/10'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Google Gemini 3.5 Transcribe Cloud API (Motor Padrão Ultrarrápido)"
              >
                <Zap className="w-3 h-3 text-amber-400 fill-current" />
                <span>Gemini API (Padrão)</span>
              </button>
              <button
                onClick={() => onEngineChange('whisper-webgpu')}
                className={`px-2 py-1 rounded font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  engine !== 'gemini-cloud'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Whisper WebGPU Local no Navegador"
              >
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>Whisper Local</span>
              </button>
            </div>
          )}

          {/* Spoken Language Selector */}
          {onLanguageChange && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-xs">
              <Globe className="w-3 h-3 text-stone-400 mr-1" />
              {(['auto', 'pt', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-1.5 py-0.5 rounded font-mono uppercase text-[10px] cursor-pointer transition-colors ${
                    language === lang
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title={
                    lang === 'auto'
                      ? 'Detecção automática de idioma'
                      : lang === 'pt'
                      ? 'Português'
                      : 'Inglês'
                  }
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onOpenExport}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-400" />
            <span>Exportar</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-medium text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-md transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer font-sans active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar MP3 / M4A</span>
          </button>
        </div>
      </div>
    </header>
  );
};
