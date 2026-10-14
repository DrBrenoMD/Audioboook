import React from 'react';
import { X, Library, Play, Sparkles } from 'lucide-react';
import { BookCoverArt } from './BookCoverArt';
import { SAMPLE_AUDIOBOOKS } from '../services/sampleAudiobooks';
import { AudiobookItem } from '../types/audiobook';

interface DemoLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: AudiobookItem) => void;
  activeBookId: string;
}

export const DemoLibraryModal: React.FC<DemoLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  activeBookId,
}) => {
  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-100">
                Biblioteca de Demonstração
              </h3>
              <p className="text-xs text-stone-400">
                Audiolivros clássicos com narração e transcrição pré-sincronizada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-md hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SAMPLE_AUDIOBOOKS.map((book) => {
            const isCurrent = book.id === activeBookId;

            return (
              <div
                key={book.id}
                onClick={() => {
                  onSelectBook(book);
                  onClose();
                }}
                className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3 ${
                  isCurrent
                    ? 'border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30'
                    : 'border-stone-800 bg-stone-950/60 hover:border-amber-500/50 hover:bg-stone-950/90'
                }`}
              >
                {/* Book Cover */}
                <div className="shadow-md">
                  <BookCoverArt
                    title={book.title}
                    author={book.author}
                    theme={book.coverTheme}
                    format={book.format}
                    size="md"
                  />
                </div>

                {/* Details */}
                <div className="space-y-1 w-full">
                  <h4 className="font-serif font-bold text-sm text-stone-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-stone-400 font-sans line-clamp-1">
                    {book.author}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-stone-500 pt-1">
                    <span>{formatDuration(book.duration)}</span>
                    <span>·</span>
                    <span className="uppercase text-amber-400/80 font-bold">{book.format}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  className={`w-full py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-stone-950 font-bold'
                      : 'bg-stone-800 text-stone-200 group-hover:bg-amber-500/20 group-hover:text-amber-300'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isCurrent ? 'Em Reprodução' : 'Ouvir Agora'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="flex items-center gap-2 text-xs text-stone-400 bg-stone-950/40 p-3 rounded-lg border border-stone-800/60">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Você também pode carregar seus próprios audiolivros em MP3 ou M4A a qualquer momento.
          </span>
        </div>
      </div>
    </div>
  );
};
