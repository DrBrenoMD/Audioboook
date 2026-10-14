import { AudiobookItem, TranscriptionSegment, WordTimestamp } from '../types/audiobook';

// Helper to create word timestamps with natural cadence (~2.5 to 3.5 words per second)
function generateWordsFromText(text: string, startTime: number, wordsPerSec = 2.8): WordTimestamp[] {
  const rawWords = text.trim().split(/\s+/);
  const words: WordTimestamp[] = [];
  let currentStart = startTime;

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    // Punctuation adds slight natural pause
    const hasPunctuation = /[.,!?;:]$/.test(word);
    const duration = (0.28 + (word.length * 0.03)) * (1 / (wordsPerSec / 3));
    const pause = hasPunctuation ? 0.22 : 0.05;
    const end = parseFloat((currentStart + duration).toFixed(2));

    words.push({
      id: `word_${Math.round(currentStart * 100)}_${i}`,
      word,
      start: parseFloat(currentStart.toFixed(2)),
      end,
    });

    currentStart = end + pause;
  }

  return words;
}

// 1. Dom Casmurro - Machado de Assis
const domCasmurroParagraphs = [
  "Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, o qual eu conhecia de vista e de chapéu.",
  "Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus.",
  "Sucedeu porém que, como eu estivesse cansado, fechei os olhos, cochilei. Quando acordei, ele já tinha chegado à sua estação e saltara.",
  "No dia seguinte entraram a chamar-me Dom Casmurro. Os vizinhos, que não gostam dos meus hábitos reclusos e calados, deram curso à alcunha, que afinal pegou.",
  "Não me enfadei. Contei a anedota aos amigos da cidade, e eles, por graça, terminaram chamando-me assim.",
];

function buildSegments(paragraphs: string[], initialOffset = 0.5): TranscriptionSegment[] {
  const segments: TranscriptionSegment[] = [];
  let offset = initialOffset;

  paragraphs.forEach((pText, idx) => {
    const words = generateWordsFromText(pText, offset, 2.7);
    const start = words[0]?.start ?? offset;
    const end = words[words.length - 1]?.end ?? (offset + 5);

    segments.push({
      id: `seg_${idx}`,
      start,
      end,
      text: pText,
      words,
    });

    offset = end + 0.8; // pause between paragraphs
  });

  return segments;
}

const domCasmurroSegments = buildSegments(domCasmurroParagraphs, 0.4);
const domCasmurroDuration = Math.ceil(domCasmurroSegments[domCasmurroSegments.length - 1].end + 2);

// 2. O Alienista - Machado de Assis
const alienistaParagraphs = [
  "As crônicas da vila de Itaguaí dizem que no princípio do século passado o médico Simão Bacamarte, filho da nobreza da terra e o maior dos médicos do Brasil, de Portugal e das Espanhas, fundou uma casa de saúde mental.",
  "Tendo estudado em Coimbra e Pádua, aos trinta e quatro anos regressou ao Brasil, não podendo o rei alcançar dele que ficasse em Lisboa a cuidar do reino.",
  "A ciência, dizia ele a Sua Majestade, era o seu único emprego e a verdadeira paixão do seu espírito.",
  "A câmara de Itaguaí deu-lhe autorização para acolher todos os furiosos e desvairados que andavam pelas ruas e matas da capitania.",
];

const alienistaSegments = buildSegments(alienistaParagraphs, 0.5);
const alienistaDuration = Math.ceil(alienistaSegments[alienistaSegments.length - 1].end + 2);

// 3. The Adventures of Sherlock Holmes - Arthur Conan Doyle
const sherlockParagraphs = [
  "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.",
  "It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.",
  "He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.",
  "He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer, excellent for drawing the veil from men's motives and actions.",
];

const sherlockSegments = buildSegments(sherlockParagraphs, 0.5);
const sherlockDuration = Math.ceil(sherlockSegments[sherlockSegments.length - 1].end + 2);

export const SAMPLE_AUDIOBOOKS: AudiobookItem[] = [
  {
    id: 'dom-casmurro',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    narrator: 'Voz Clássica Português',
    duration: domCasmurroDuration,
    format: 'mp3',
    audioUrl: '', // generated dynamically via Web Audio synthesizer or audio stream
    isDemo: true,
    coverTitle: 'Dom Casmurro',
    coverAuthor: 'Machado de Assis',
    coverTheme: 'emerald',
    preloadedSegments: domCasmurroSegments,
  },
  {
    id: 'sherlock-holmes',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Sir Arthur Conan Doyle',
    narrator: 'Narrator Studio UK',
    duration: sherlockDuration,
    format: 'm4a',
    audioUrl: '',
    isDemo: true,
    coverTitle: 'Sherlock Holmes',
    coverAuthor: 'A. Conan Doyle',
    coverTheme: 'burgundy',
    preloadedSegments: sherlockSegments,
  },
  {
    id: 'o-alienista',
    title: 'O Alienista',
    author: 'Machado de Assis',
    narrator: 'Voz Dramática',
    duration: alienistaDuration,
    format: 'mp3',
    audioUrl: '',
    isDemo: true,
    coverTitle: 'O Alienista',
    coverAuthor: 'Machado de Assis',
    coverTheme: 'indigo',
    preloadedSegments: alienistaSegments,
  },
];
