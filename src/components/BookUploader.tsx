import React, { useState, useRef } from 'react';
import { Upload, FileAudio, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface BookUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (file: File) => void;
}

export const BookUploader: React.FC<BookUploaderProps> = ({
  isOpen,
  onClose,
  onFileLoaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);

    const name = file.name.toLowerCase();
    const isMp3 = name.endsWith('.mp3') || file.type.includes('mpeg') || file.type.includes('mp3');
    const isM4a = name.endsWith('.m4a') || name.endsWith('.aac') || file.type.includes('m4a') || file.type.includes('mp4');

    if (!isMp3 && !isM4a) {
      setErrorMsg('Formato não suportado. Por favor, selecione um arquivo de audiolivro em formato MP3 ou M4A.');
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setErrorMsg('O arquivo excede o limite recomendado de 250MB para decodificação em memória.');
      return;
    }

    onFileLoaded(file);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100">
                Carregar Audiolivro
              </h3>
              <p className="text-xs text-stone-400">
                Formatos aceitos: MP3 e M4A (áudio local sem envio externo)
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

        {/* Drag and drop target */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-stone-700 hover:border-amber-500/60 bg-stone-950/50 hover:bg-stone-950/80'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp3,.m4a,audio/mp3,audio/mpeg,audio/x-m4a,audio/mp4"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-stone-800 flex items-center justify-center text-amber-400 shadow-inner">
            <FileAudio className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-medium text-stone-200">
              Arraste seu audiolivro aqui ou <span className="text-amber-400 underline">clique para selecionar</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Compatível com arquivos .MP3 e .M4A de qualquer taxa de amostragem
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-stone-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
            <span>MP3</span>
            <span>·</span>
            <span>M4A</span>
            <span>·</span>
            <span>AAC</span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-xs text-stone-400 border-t border-stone-800 pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Antecipação 10-15s à frente</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Karaoke palavra por palavra</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Whisper WebGPU no navegador</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Privacidade total garantida</span>
          </div>
        </div>
      </div>
    </div>
  );
};
