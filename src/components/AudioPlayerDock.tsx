import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Sparkles, Gauge } from 'lucide-react';
import { BookCoverArt } from './BookCoverArt';
import { LookaheadBufferState } from '../types/audiobook';

interface AudioPlayerDockProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  bookTitle: string;
  bookAuthor: string;
  format: 'mp3' | 'm4a';
  themeColor: 'emerald' | 'burgundy' | 'indigo' | 'slate' | 'amber';
  waveform?: number[];
  lookaheadState: LookaheadBufferState;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onOpenLibrary: () => void;
}

export const AudioPlayerDock: React.FC<AudioPlayerDockProps> = ({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  isMuted,
  bookTitle,
  bookAuthor,
  format,
  themeColor,
  waveform = [],
  lookaheadState,
  onPlayPause,
  onSeek,
  onPlaybackRateChange,
  onVolumeChange,
  onToggleMute,
  onOpenLibrary,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent =
    duration > 0 ? Math.min(100, (lookaheadState.transcribedUpTo / duration) * 100) : 0;

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 border-t border-stone-800 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Waveform Scrubber & Lookahead Progress */}
        <div className="relative group cursor-pointer pt-1" onClick={handleProgressBarClick} ref={progressBarRef}>
          {/* Subtle audio waveform background visualization */}
          <div className="h-6 w-full flex items-end gap-[2px] opacity-40 group-hover:opacity-60 transition-opacity overflow-hidden mb-1">
            {waveform.length > 0 ? (
              waveform.map((bar, idx) => {
                const barRatio = idx / waveform.length;
                const isPassed = barRatio * duration <= currentTime;
                const isBuffered = barRatio * duration <= lookaheadState.transcribedUpTo;

                let barColor = 'bg-stone-700';
                if (isPassed) {
                  barColor = 'bg-amber-400';
                } else if (isBuffered) {
                  barColor = 'bg-amber-600/50';
                }

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t-sm transition-colors duration-150 ${barColor}`}
                    style={{ height: `${Math.max(15, bar * 100)}%` }}
                  />
                );
              })
            ) : (
              <div className="w-full h-1 bg-stone-800" />
            )}
          </div>

          {/* Interactive Progress Bar */}
          <div className="relative h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
            {/* Lookahead buffer track (amber transparent) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-amber-600/35 transition-all duration-300"
              style={{ width: `${bufferPercent}%` }}
              title={`Buffer transcrito: ${formatTime(lookaheadState.transcribedUpTo)}`}
            />

            {/* Playhead progress track (bright amber) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400"
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          {/* Playhead Scrubber Dot */}
          <div
            className="absolute top-[26px] -ml-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-stone-950 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${currentPercent}%` }}
          />
        </div>

        {/* Player Controls Strip */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Book Meta & Cover Preview */}
          <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-xs">
            <div className="cursor-pointer" onClick={onOpenLibrary} title="Trocar audiolivro">
              <BookCoverArt
                title={bookTitle}
                author={bookAuthor}
                theme={themeColor}
                format={format}
                size="sm"
              />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs sm:text-sm font-semibold text-stone-100 truncate font-serif">
                {bookTitle}
              </h5>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span className="truncate">{bookAuthor}</span>
                <span>·</span>
                <span className="font-mono text-amber-400/90 font-bold uppercase">{format}</span>
              </div>
            </div>
          </div>

          {/* Center: Main Playback Buttons */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Skip backward 10s */}
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                className="p-2 text-stone-400 hover:text-stone-100 transition-colors rounded-full hover:bg-stone-800 cursor-pointer"
                title="Retroceder 10 segundos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={onPlayPause}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Skip forward 10s */}
              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                className="p-2 text-stone-400 hover:text-stone-100 transition-colors rounded-full hover:bg-stone-800 cursor-pointer"
                title="Avançar 10 segundos"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Time display with tabular figures */}
            <div className="text-[11px] font-mono text-stone-400 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span className="text-stone-600 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Controls (Speed, Volume, Lookahead Badge) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Lookahead status pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono text-stone-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Buffer: +12s</span>
            </div>

            {/* Playback Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium text-stone-300 hover:text-amber-300 bg-stone-900 border border-stone-800 rounded transition-colors cursor-pointer"
                title="Velocidade de reprodução"
              >
                <Gauge className="w-3.5 h-3.5 text-stone-400" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-stone-900 border border-stone-800 rounded-md shadow-xl py-1 z-50 min-w-[70px]">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1 text-xs font-mono cursor-pointer transition-colors ${
                        playbackRate === rate
                          ? 'bg-amber-500/20 text-amber-400 font-bold'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-stone-800 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                title="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
