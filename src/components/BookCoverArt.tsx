import React from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  theme?: 'emerald' | 'burgundy' | 'indigo' | 'slate' | 'amber';
  format?: 'mp3' | 'm4a';
  size?: 'sm' | 'md' | 'lg';
}

export const BookCoverArt: React.FC<BookCoverProps> = ({
  title,
  author,
  theme = 'emerald',
  format = 'mp3',
  size = 'md',
}) => {
  const themeStyles = {
    emerald: {
      bg: 'bg-emerald-950',
      border: 'border-emerald-700/60',
      accent: 'text-amber-300',
      filigree: '#10b981',
      gold: '#f59e0b',
    },
    burgundy: {
      bg: 'bg-rose-950',
      border: 'border-rose-700/60',
      accent: 'text-amber-200',
      filigree: '#f43f5e',
      gold: '#fbbf24',
    },
    indigo: {
      bg: 'bg-indigo-950',
      border: 'border-indigo-700/60',
      accent: 'text-sky-200',
      filigree: '#6366f1',
      gold: '#38bdf8',
    },
    slate: {
      bg: 'bg-stone-900',
      border: 'border-stone-700/60',
      accent: 'text-amber-400',
      filigree: '#a8a29e',
      gold: '#eab308',
    },
    amber: {
      bg: 'bg-amber-950',
      border: 'border-amber-700/60',
      accent: 'text-amber-300',
      filigree: '#f59e0b',
      gold: '#fbbf24',
    },
  }[theme];

  const sizeClasses = {
    sm: 'w-16 h-22 text-[9px] p-1.5',
    md: 'w-28 h-38 text-xs p-3',
    lg: 'w-48 h-64 text-sm p-4',
  }[size];

  return (
    <div
      className={`relative select-none shrink-0 rounded-sm shadow-xl ${themeStyles.bg} border ${themeStyles.border} ${sizeClasses} flex flex-col justify-between overflow-hidden transition-transform duration-200 hover:scale-[1.02]`}
      style={{
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), inset 3px 0 6px rgba(0,0,0,0.4)',
      }}
    >
      {/* Spine highlight / leather emboss */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />

      {/* Ornate corner filigree border */}
      <div className="absolute inset-1.5 border border-amber-500/30 rounded-[1px] pointer-events-none flex flex-col justify-between p-1">
        <div className="flex justify-between text-[8px] text-amber-500/40">
          <span>✦</span>
          <span>✦</span>
        </div>
        <div className="flex justify-between text-[8px] text-amber-500/40">
          <span>✦</span>
          <span>✦</span>
        </div>
      </div>

      {/* Format watermark */}
      <div className="relative z-10 flex justify-between items-center text-[10px] tracking-widest uppercase font-mono text-stone-400">
        <span>AUDIOBOOK</span>
        <span className="text-amber-400/80 font-bold">{format.toUpperCase()}</span>
      </div>

      {/* Book title and author */}
      <div className="relative z-10 my-auto text-center px-1">
        <h4
          className="font-serif font-bold text-amber-100 tracking-wide line-clamp-3 leading-tight drop-shadow-sm"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {title}
        </h4>
        <div className="w-6 h-px bg-amber-500/50 mx-auto my-1.5" />
        <p className="text-[10px] text-stone-300 font-sans tracking-wider uppercase line-clamp-1">
          {author}
        </p>
      </div>

      {/* Bottom curatorial emblem */}
      <div className="relative z-10 flex items-center justify-center gap-1 text-[8px] text-amber-400/60 font-serif italic">
        <span>VoxLibris Edition</span>
      </div>
    </div>
  );
};
