# VoxLibris — Transcritor de Audiolivros com Destaque Karaoke em Tempo Real

Aplicação web premium e imersiva para audição e transcrição antecipada de audiolivros (MP3 e M4A), com motor Whisper WebGPU local no navegador, buffer inteligente de 10 a 15 segundos à frente da reprodução e sincronização visual palavra por palavra no estilo karaoke.

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> Decisões alinhadas na Fase 1 com o usuário:
> - **Motor de Transcrição**: Whisper WebGPU executado 100% no navegador (privado, gratuito e com timestamps por palavra), contando com fallback instantâneo via Gemini 2.5 Flash na rota de backend para máxima compatibilidade caso o dispositivo não possua WebGPU.
> - **Antecipação da Transcrição**: 10 a 15 segundos à frente do ponto de reprodução corrente (1 a 2 frases adiante), garantindo que o texto já esteja renderizado antes da voz alcançar as palavras.
> - **Interface & Experiência**: Leitor imersivo estilo Audio-eReader (Audible / Kindle), tipografia editorial elegante, controle de velocidade fluido (0.75x a 2.0x), clique-para-ouvir nas palavras e temas de leitura (Papel Quente, Sépia e Obsidian Dark).

---

## 1. Visão Geral & Conceito Central

- **O que faz**: Permite que o usuário faça upload ou arraste arquivos de audiolivro em formatos **MP3** ou **M4A** (além de audiolivros clássicos prontos para teste imediato). Conforme o áudio toca, a engine transcreve de forma antecipada (10 a 15s adiante), exibindo o texto fluido na tela e iluminando dinamicamente em tempo real a palavra exata que está sendo narrada.
- **Público-alvo**: Leitores de audiolivros, estudantes de idiomas, pessoas com deficiência auditiva parcial ou TDAH que se beneficiam da leitura bimodal (áudio + texto sincronizado), e revisores de conteúdo sonoro.
- **Diferencial de valor**: Zero custo de infraestrutura contínua, total privacidade (o áudio não precisa sair da máquina do usuário quando em WebGPU), interface com design editorial de alto padrão e latência imperceptível.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais
1. **Pouso & Seleção de Audiolivro**:
   - Área de drag-and-drop para arquivos `.mp3` e `.m4a` com detecção de metadados (duração, taxa de amostragem, nome do arquivo).
   - Prateleira de audiolivros de demonstração prontos (ex.: *Dom Casmurro* por Machado de Assis, *Sherlock Holmes* por Arthur Conan Doyle, *Alice no País das Maravilhas*) para teste com um clique.
2. **Leitor Editorial Sincronizado**:
   - Layout de leitura centrado e focado (`max-w-3xl`) com tipografia de livro (Fraunces / Cormorant Garamond para títulos e Lora / Plus Jakarta Sans para leitura).
   - Efeito Karaoke: Palavra corrente destacada com fundo suave em âmbar quente/ouro curatorial e leve escala; palavras lidas com opacidade total; palavras transcritas no buffer adiante com opacidade sutil de antecipação.
   - Navegação bidirecional: clicar em qualquer palavra ou frase retrocede ou avança o áudio imediatamente para aquele exato timestamp.
3. **Barra de Controle de Áudio Fixa (Dock Inferior)**:
   - Botões de reproduzir/pausar, avançar/retroceder 10s, barra de progresso scrubber com forma de onda de áudio.
   - Controle de velocidade (0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x).
   - Indicador discreto de buffer de antecipação (+12s carregados à frente).
   - Modos de visualização (Tamanho de fonte A- / A+, Modo Zen em tela cheia e alternância de temas Claro Papel / Escuro Obsidian).
4. **Exportação & Utilidades**:
   - Download do texto transcrito completo em `.txt`, legendas sincronizadas `.srt` ou estrutura enriquecida `.json` com timestamps por palavra.

### Identidade Visual & Diretrizes Anti-Slop
- **Paleta de Cores (60-30-10)**:
  - *Modo Obsidian*: Fundo `#0C0A09` (Stone 950), superfícies estruturais `#1C1917` (Stone 900), texto `#F5F5F4` (Stone 100), destaque de leitura `#F59E0B` (Âmbar 500 com brilho dourado suave).
  - *Modo Papel Alabastro*: Fundo `#FBF9F5`, divisores `#E7E5E4`, texto `#1C1917`, destaque âmbar suave `#FEF3C7` / `#D97706`.
- **Disciplina Tipográfica**: Sem pílulas estáticas ou badges coloridos de enfeite; metadados (duração, bitrate, palavras por minuto) apresentados com separadores tipográficos limpos (`·`). Números em algarismos tabulares (`tabular-nums`).

---

## 3. Decisões Técnicas & Arquitetura

### A. Pipeline de Transcrição por Buffer de Antecipação (10–15 segundos)
```
  [ Arquivo MP3 / M4A ]
           │
           ▼
  [ Web Audio API: AudioContext ] ──▶ Decodificação Nativa em Float32Array PCM
           │
           ├─────────────────────────────────────────┐
           ▼                                         ▼
   [ Playback Player ]                     [ Buffer Lookahead Manager ]
  currentTime = T segundos                  Janela [T, T + 12s]
           │                                         │
           │                                         ▼
           │                           [ Worker Whisper WebGPU ]
           │                                         │
           │                                         ▼
           │                          Segmentos & Timestamps de Palavras
           │                                         │
           ▼                                         ▼
    [ Sync Engine ] ◀────────────────────────────────┘
  Identifica palavra ativa onde:
  w.start <= currentTime < w.end
           │
           ▼
  [ Renderizador Karaoke DOM ]
  (Scroll suave automático até a frase corrente)
```

### B. Suporte Completo a MP3 e M4A
- O navegador decodifica `.mp3` e `.m4a` (AAC) nativamente através de `AudioContext.decodeAudioData()`, sem necessidade de bibliotecas pesadas de conversão externa.
- O pipeline converte a janela de áudio selecionada para 16kHz mono (formato esperado pelo Whisper).

### C. Estrutura de Dados
```typescript
interface WordTimestamp {
  id: string;
  word: string;
  start: number; // segundos no áudio
  end: number;   // segundos no áudio
}

interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

interface Audiobook {
  id: string;
  title: string;
  author: string;
  audioUrl: string;
  duration: number;
  format: 'mp3' | 'm4a';
  coverUrl?: string;
  preloadedSegments?: TranscriptionSegment[];
}
```

---

## 4. Plano de Implementação em Fases

1. **Configuração de Dependências e Utilitários de Áudio**:
   - Biblioteca de ícones `lucide-react` (já instalada) e transições suaves com `motion`.
   - Módulo Web Audio API para decodificação de `.mp3`/`.m4a`, fatiamento de chunks e reamostragem a 16kHz.
2. **Motor de Transcrição & Buffer Inteligente**:
   - Integração com `@huggingface/transformers` (Whisper WebGPU) rodando em Web Worker dedicado sem bloquear a interface de usuário.
   - Rota de servidor `/api/transcribe` com Gemini 2.5 Flash como acelerador instantâneo opcional para áudios longos ou equipamentos sem WebGPU.
3. **Engine de Sincronia Karaoke (60fps)**:
   - Sincronizador de alta precisão via `requestAnimationFrame` que mapeia `audio.currentTime` às palavras ativas.
   - Rolagem automática suave focando na sentença em leitura com controle de scroll manual desimpedida.
4. **Interface eReader Imersiva**:
   - Cabeçalho minimalista de 3 zonas (Top Bar Contract).
   - Seletor de audiolivro (upload local com drag & drop + biblioteca de clássicos para demonstração imediata).
   - Visualizador de texto com iluminação por palavra, ajuste de tamanho de fonte e alternância de temas.
   - Barra de reprodução inferior completa com scrubber, velocidade (0.75x - 2x) e exportação (TXT, SRT, JSON).
5. **Verificação & Testes**:
   - Teste de compilação com `compile_applet` e verificação de reprodução e sincronização.
