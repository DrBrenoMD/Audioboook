import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import { TranscriptionSegment, WordTimestamp } from '../types/audiobook';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  segments: TranscriptionSegment[];
  words: WordTimestamp[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  segments,
  words,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format generators
  const generatePlainText = (): string => {
    return segments.map((s) => s.text).join('\n\n');
  };

  const generateSRT = (): string => {
    const formatSRTTime = (seconds: number): string => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };

    return segments
      .map((seg, idx) => {
        return `${idx + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text}\n`;
      })
      .join('\n');
  };

  const generateJSON = (): string => {
    return JSON.stringify(
      {
        title,
        exportedAt: new Date().toISOString(),
        totalWords: words.length,
        segments,
      },
      null,
      2
    );
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (content: string, formatName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(formatName);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-100">
                Exportar Transcrição
              </h3>
              <p className="text-xs text-stone-400">
                Baixe o texto completo com ou sem timestamps de áudio
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

        {/* Options list */}
        <div className="space-y-3">
          {/* Plain Text (.txt) */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-semibold text-stone-200">Texto Simples (.TXT)</h4>
                <p className="text-xs text-stone-500">Parágrafos corridos ideais para leitura e impressão</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(generatePlainText(), 'TXT')}
                className="px-2.5 py-1.5 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'TXT' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
              <button
                onClick={() => downloadFile(generatePlainText(), `${sanitizedTitle}.txt`, 'text/plain')}
                className="px-3 py-1.5 rounded text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>
          </div>

          {/* Subtitles (.SRT) */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-stone-200">Legendas Sincronizadas (.SRT)</h4>
                <p className="text-xs text-stone-500">Com timestamps exatos de início e fim por frase</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(generateSRT(), 'SRT')}
                className="px-2.5 py-1.5 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'SRT' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
              <button
                onClick={() => downloadFile(generateSRT(), `${sanitizedTitle}.srt`, 'application/x-subrip')}
                className="px-3 py-1.5 rounded text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>
          </div>

          {/* JSON Structure */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-stone-950/60 border border-stone-800 hover:border-stone-700 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <div>
                <h4 className="text-sm font-semibold text-stone-200">Estrutura de Palavras (.JSON)</h4>
                <p className="text-xs text-stone-500">Dados completos com timestamps por palavra para desenvolvedores</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(generateJSON(), 'JSON')}
                className="px-2.5 py-1.5 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedFormat === 'JSON' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar</span>
              </button>
              <button
                onClick={() => downloadFile(generateJSON(), `${sanitizedTitle}.json`, 'application/json')}
                className="px-3 py-1.5 rounded text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
