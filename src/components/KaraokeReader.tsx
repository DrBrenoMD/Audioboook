import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WordTimestamp, TranscriptionSegment, ReaderTheme, FontSize, LookaheadBufferState } from '../types/audiobook';
import { Search, Sparkles, Navigation, Type, Palette } from 'lucide-react';

interface KaraokeReaderProps {
  segments: TranscriptionSegment[];
  words: WordTimestamp[];
  currentTime: number;
  duration: number;
  lookaheadState: LookaheadBufferState;
  onSeek: (time: number) => void;
  title: string;
  author: string;
  narrator?: string;
  format?: 'mp3' | 'm4a';
  modelStatus?: { isLoading: boolean; progress: number; message: string };
}

export const KaraokeReader: React.FC<KaraokeReaderProps> = ({
  segments,
  words,
  currentTime,
  duration,
  lookaheadState,
  onSeek,
  title,
  author,
  narrator,
  format = 'mp3',
  modelStatus,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>('obsidian');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Find currently active word
  const activeWordIndex = useMemo(() => {
    if (!words || words.length === 0) return -1;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (currentTime >= w.start && currentTime <= w.end) {
        return i;
      }
      // If between words during brief pauses, highlight previous or next word
      if (i < words.length - 1 && currentTime > w.end && currentTime < words[i + 1].start) {
        return i;
      }
    }
    // If before first word
    if (words.length > 0 && currentTime < words[0].start) {
      return 0;
    }
    return -1;
  }, [words, currentTime]);

  // Smooth auto-scroll to keep active word in view
  useEffect(() => {
    if (!autoScroll || !activeWordRef.current || !containerRef.current) return;

    const el = activeWordRef.current;
    const container = containerRef.current;

    const elTop = el.offsetTop;
    const containerHeight = container.clientHeight;
    const targetScroll = elTop - containerHeight * 0.38;

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  }, [activeWordIndex, autoScroll]);

  // Theme palettes adhering to museum and editorial guidelines
  const themeClasses = {
    obsidian: {
      bg: 'bg-stone-950',
      cardBg: 'bg-stone-900/40',
      border: 'border-stone-800/80',
      text: 'text-stone-200',
      textMuted: 'text-stone-500',
      title: 'text-stone-100',
      activeWord: 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-semibold ring-2 ring-amber-400/40',
      pastWord: 'text-stone-300',
      futureBufferWord: 'text-stone-300 bg-amber-500/5',
      pendingWord: 'text-stone-600',
      highlightDot: 'bg-amber-400',
    },
    paper: {
      bg: 'bg-[#FBF9F5]',
      cardBg: 'bg-[#F4EFE6]/60',
      border: 'border-stone-300/80',
      text: 'text-stone-800',
      textMuted: 'text-stone-600',
      title: 'text-stone-900',
      activeWord: 'bg-amber-400 text-stone-950 shadow-sm font-semibold ring-2 ring-amber-500/40',
      pastWord: 'text-stone-800',
      futureBufferWord: 'text-stone-700 bg-amber-600/10',
      pendingWord: 'text-stone-400',
      highlightDot: 'bg-amber-600',
    },
    sepia: {
      bg: 'bg-[#F4ECD8]',
      cardBg: 'bg-[#EAE0C8]/60',
      border: 'border-[#DAC8A8]',
      text: 'text-[#2B2118]',
      textMuted: 'text-[#6B5A4B]',
      title: 'text-[#1E1711]',
      activeWord: 'bg-[#C26D24] text-amber-50 shadow-sm font-semibold ring-2 ring-[#9C551B]/40',
      pastWord: 'text-[#2B2118]',
      futureBufferWord: 'text-[#3E3024] bg-amber-700/10',
      pendingWord: 'text-[#8C7A68]',
      highlightDot: 'bg-[#C26D24]',
    },
  }[theme];

  const fontSizes = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-loose',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose',
  }[fontSize];

  return (
    <div className={`relative flex flex-col h-full ${themeClasses.bg} transition-colors duration-300`}>
      {/* Editorial Sub-Header / Reading Controls */}
      <div className={`px-6 py-3 border-b ${themeClasses.border} flex flex-wrap items-center justify-between gap-4 select-none shrink-0`}>
        {/* Book Title & Chapter Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-xs font-serif">
            <span className={`font-bold ${themeClasses.title} truncate max-w-xs sm:max-w-md`}>
              {title}
            </span>
            <span className={themeClasses.textMuted}>·</span>
            <span className={themeClasses.textMuted}>{author}</span>
            {narrator && (
              <>
                <span className={themeClasses.textMuted}>·</span>
                <span className={`hidden sm:inline ${themeClasses.textMuted}`}>Voz: {narrator}</span>
              </>
            )}
          </div>
        </div>

        {/* Reader Preferences Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Toggle */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-1.5 bg-stone-900/60 border border-stone-700 rounded-md px-2 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar texto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-stone-200 outline-none w-28 sm:w-36 text-xs"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="text-stone-400 hover:text-stone-200 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className={`p-1.5 rounded-md hover:bg-stone-500/10 ${themeClasses.textMuted} hover:${themeClasses.title} transition-colors cursor-pointer`}
                title="Buscar no texto"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-md border border-stone-700/50">
            <button
              onClick={() => setTheme('obsidian')}
              className={`px-2 py-1 text-xs font-sans rounded transition-colors cursor-pointer ${
                theme === 'obsidian'
                  ? 'bg-stone-800 text-amber-300 font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tema Escuro Obsidian"
            >
              Obsidian
            </button>
            <button
              onClick={() => setTheme('paper')}
              className={`px-2 py-1 text-xs font-sans rounded transition-colors cursor-pointer ${
                theme === 'paper'
                  ? 'bg-[#EAE4D7] text-stone-900 font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tema Papel Alabastro"
            >
              Papel
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`px-2 py-1 text-xs font-sans rounded transition-colors cursor-pointer ${
                theme === 'sepia'
                  ? 'bg-[#DAC8A8] text-[#1E1711] font-medium'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tema Sépia Clássico"
            >
              Sépia
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-stone-700/50">
            {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-1 text-xs font-serif rounded transition-colors cursor-pointer ${
                  fontSize === size
                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
              autoScroll
                ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                : 'border-stone-700 text-stone-400 hover:text-stone-300'
            }`}
            title="Acompanhar rolagem automaticamente"
          >
            <Navigation className="w-3 h-3" />
            <span className="hidden sm:inline">Acompanhar</span>
          </button>
        </div>
      </div>

      {/* Whisper Model Download / Loading Progress Banner */}
      {modelStatus?.isLoading && (
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200 shrink-0 select-none animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="font-medium">{modelStatus.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-amber-300">{modelStatus.progress}%</span>
            <div className="w-24 sm:w-36 bg-stone-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${Math.max(8, modelStatus.progress)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lookahead Buffer Telemetry Banner */}
      <div className={`px-6 py-2 bg-amber-500/5 border-b ${themeClasses.border} flex items-center justify-between text-xs font-mono text-stone-400 select-none shrink-0`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            Antecipação de Transcrição:
            <strong className="text-amber-300 font-bold ml-1">
              +{Math.max(0, Math.round(lookaheadState.transcribedUpTo - currentTime))}s à frente
            </strong>
          </span>
          <span className="hidden sm:inline text-stone-500">·</span>
          <span className="hidden sm:inline text-stone-400">
            {words.length} palavras sincronizadas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-wider text-stone-500">
            Clique em qualquer palavra para ouvir
          </span>
        </div>
      </div>

      {/* Main Reading Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 max-w-4xl mx-auto w-full space-y-8 scroll-smooth"
      >
        {words.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <h3 className={`text-xl font-serif font-bold ${themeClasses.title}`}>
              Preparando transcrição antecipada...
            </h3>
            <p className={`text-sm ${themeClasses.textMuted} max-w-md mx-auto`}>
              Iniciando motor de escuta e decodificando os primeiros segundos do audiolivro.
            </p>
          </div>
        ) : (
          segments.map((segment, segIdx) => {
            return (
              <div
                key={segment.id || segIdx}
                className={`relative p-6 sm:p-8 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg} transition-all duration-300`}
              >
                {/* Paragraph header badge */}
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 mb-3 select-none">
                  <span>
                    PARÁGRAFO {segIdx + 1}
                  </span>
                  <span className="tabular-nums">
                    {Math.floor(segment.start / 60)}:{Math.floor(segment.start % 60).toString().padStart(2, '0')} - {Math.floor(segment.end / 60)}:{Math.floor(segment.end % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Paragraph prose with karaoke word highlighting */}
                <p
                  className={`font-serif ${fontSizes} ${themeClasses.text} tracking-normal selection:bg-amber-400/30`}
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    textWrap: 'pretty',
                  }}
                >
                  {segment.words.map((wordObj) => {
                    const isWordActive =
                      currentTime >= wordObj.start && currentTime <= wordObj.end;
                    const isPast = currentTime > wordObj.end;
                    const isLookaheadBuffered =
                      wordObj.start > currentTime && wordObj.start <= currentTime + 12;

                    // Match search query
                    const matchesSearch =
                      searchQuery.trim().length > 1 &&
                      wordObj.word.toLowerCase().includes(searchQuery.toLowerCase());

                    let wordStyle = themeClasses.pendingWord;
                    if (isWordActive) {
                      wordStyle = themeClasses.activeWord;
                    } else if (isPast) {
                      wordStyle = themeClasses.pastWord;
                    } else if (isLookaheadBuffered) {
                      wordStyle = themeClasses.futureBufferWord;
                    }

                    return (
                      <span
                        key={wordObj.id}
                        ref={isWordActive ? activeWordRef : null}
                        onClick={() => onSeek(wordObj.start)}
                        title={`Timestamp: ${wordObj.start.toFixed(1)}s (clique para pular)`}
                        className={`inline-block mx-[2.5px] my-[1px] px-1 py-0.5 rounded cursor-pointer transition-all duration-150 ${wordStyle} ${
                          matchesSearch ? 'underline decoration-amber-400 decoration-2' : ''
                        } hover:ring-1 hover:ring-amber-400/60`}
                      >
                        {wordObj.word}
                      </span>
                    );
                  })}
                </p>
              </div>
            );
          })
        )}

        {/* Spacing for bottom floating dock */}
        <div className="h-28" />
      </div>
    </div>
  );
};
