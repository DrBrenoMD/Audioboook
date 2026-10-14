import React from 'react';
import { BookOpen, Upload, Library, Download, Cpu } from 'lucide-react';

interface TopNavProps {
  onOpenUpload: () => void;
  onOpenLibrary: () => void;
  onOpenExport: () => void;
  currentBookTitle?: string;
  hasWebGPU?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenUpload,
  onOpenLibrary,
  onOpenExport,
  currentBookTitle = 'Dom Casmurro',
  hasWebGPU = true,
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

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400/90 whitespace-nowrap shrink-0">
            <Cpu className="w-3.5 h-3.5" />
            <span>{hasWebGPU ? 'Whisper WebGPU Local' : 'Whisper WASM Local'}</span>
          </div>

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
