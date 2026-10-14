import { useState, useEffect, useRef, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { KaraokeReader } from './components/KaraokeReader';
import { AudioPlayerDock } from './components/AudioPlayerDock';
import { BookUploader } from './components/BookUploader';
import { DemoLibraryModal } from './components/DemoLibraryModal';
import { ExportModal } from './components/ExportModal';
import { SAMPLE_AUDIOBOOKS } from './services/sampleAudiobooks';
import { AudiobookItem, WordTimestamp, TranscriptionSegment, LookaheadBufferState } from './types/audiobook';
import { audioEngine } from './services/audioEngine';
import { lookaheadManager } from './services/lookaheadManager';
import { checkWebGPUSupport } from './services/whisperClient';

export default function App() {
  const [currentBook, setCurrentBook] = useState<AudiobookItem>(SAMPLE_AUDIOBOOKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(SAMPLE_AUDIOBOOKS[0].duration);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [hasWebGPU, setHasWebGPU] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Transcription state
  const [words, setWords] = useState<WordTimestamp[]>([]);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [lookaheadState, setLookaheadState] = useState<LookaheadBufferState>({
    isBuffering: false,
    transcribedUpTo: 0,
    lookaheadWindow: 12,
    activeEngine: 'whisper-webgpu',
    queueStatus: 'idle',
  });

  const animFrameRef = useRef<number | null>(null);

  // Check WebGPU capabilities on mount
  useEffect(() => {
    checkWebGPUSupport().then((supported) => setHasWebGPU(supported));
  }, []);

  // Subscribe to lookahead buffer manager
  useEffect(() => {
    const unsubscribe = lookaheadManager.subscribe({
      onWordsUpdated: (newWords, newSegments) => {
        setWords(newWords);
        setSegments(newSegments);
      },
      onBufferStateChanged: (state) => {
        setLookaheadState(state);
      },
    });

    return () => unsubscribe();
  }, []);

  // Load an audiobook (demo or user uploaded)
  const loadBook = useCallback((book: AudiobookItem, isUserUpload = false, userFile?: File) => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentBook(book);

    if (isUserUpload && userFile) {
      audioEngine.loadUserAudioFile(userFile).then(({ duration: loadedDuration, waveform: wf }) => {
        setDuration(loadedDuration || 120);
        setWaveform(wf);
        lookaheadManager.reset(loadedDuration || 120);
      });
    } else {
      // Demo book
      const fullText = (book.preloadedSegments || []).map((s) => s.text).join(' ');
      const wf = audioEngine.setupDemoAudio(
        fullText,
        book.duration,
        book.id === 'sherlock-holmes' ? 'en-US' : 'pt-BR'
      );
      setDuration(book.duration);
      setWaveform(wf);
      lookaheadManager.reset(book.duration, book.preloadedSegments);
    }
  }, []);

  // Initialize first book on load
  useEffect(() => {
    loadBook(SAMPLE_AUDIOBOOKS[0]);
  }, [loadBook]);

  // Audio engine event bindings
  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => {
        setCurrentTime(time);
        lookaheadManager.onPlaybackTick(
          time,
          currentBook.format,
          currentBook.id === 'sherlock-holmes' ? 'en' : 'pt'
        );
      },
      () => {
        setIsPlaying(false);
      }
    );
  }, [currentBook]);

  // Continuous high-precision time tracking during playback
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        const time = audioEngine.getCurrentTime();
        setCurrentTime(time);
        lookaheadManager.onPlaybackTick(
          time,
          currentBook.format,
          currentBook.id === 'sherlock-holmes' ? 'en' : 'pt'
        );
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentBook]);

  // Handle Play/Pause
  const handlePlayPause = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      setIsPlaying(true);
    }
  };

  // Handle Seek
  const handleSeek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration));
    audioEngine.seek(clamped);
    setCurrentTime(clamped);
    lookaheadManager.onPlaybackTick(
      clamped,
      currentBook.format,
      currentBook.id === 'sherlock-holmes' ? 'en' : 'pt'
    );
  };

  // Handle Playback rate
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  };

  // Handle Volume
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    audioEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.8);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  // Handle user uploaded MP3 or M4A
  const handleUserFileLoaded = (file: File) => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const isM4a = file.name.toLowerCase().endsWith('.m4a') || file.type.includes('m4a');

    const newBook: AudiobookItem = {
      id: `user_${Date.now()}`,
      title: nameWithoutExt,
      author: 'Arquivo do Usuário',
      duration: 120, // will be updated when decoded
      format: isM4a ? 'm4a' : 'mp3',
      audioUrl: '',
      coverTitle: nameWithoutExt,
      coverAuthor: 'Arquivo Local',
      coverTheme: isM4a ? 'amber' : 'slate',
      isDemo: false,
    };

    loadBook(newBook, true, file);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans">
      {/* Top Bar Contract (3 zones) */}
      <TopNav
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        currentBookTitle={currentBook.title}
        hasWebGPU={hasWebGPU}
      />

      {/* Main Interactive Karaoke Reading Area */}
      <main className="flex-1 overflow-hidden relative">
        <KaraokeReader
          segments={segments}
          words={words}
          currentTime={currentTime}
          duration={duration}
          lookaheadState={lookaheadState}
          onSeek={handleSeek}
          title={currentBook.title}
          author={currentBook.author}
          narrator={currentBook.narrator}
          format={currentBook.format}
        />
      </main>

      {/* Floating Bottom Audio Player Dock */}
      <AudioPlayerDock
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        volume={volume}
        isMuted={isMuted}
        bookTitle={currentBook.title}
        bookAuthor={currentBook.author}
        format={currentBook.format}
        themeColor={currentBook.coverTheme}
        waveform={waveform}
        lookaheadState={lookaheadState}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onPlaybackRateChange={handlePlaybackRateChange}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onOpenLibrary={() => setIsLibraryOpen(true)}
      />

      {/* Modals */}
      <BookUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileLoaded={handleUserFileLoaded}
      />

      <DemoLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectBook={(book) => loadBook(book, false)}
        activeBookId={currentBook.id}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title={currentBook.title}
        segments={segments}
        words={words}
      />
    </div>
  );
}
