# Game Loop Engine

Uma engine centralizada para gerenciar o estado do jogo, transições e ações no Impostor Game.

## Visão Geral

A Game Loop Engine resolve o problema de lógica dispersa, centralizando todas as transições de estado em um único lugar com validação automática.

### Antes vs Depois

| Antes                                               | Depois                                  |
| :-------------------------------------------------- | :-------------------------------------- |
| Lógica de transição espalhada em vários componentes | Todas as transições em `transitions.ts` |
| Sem validação de transições                         | Validação automática via state machine  |
| Estado calculado em `useEffect` complexos           | Hook `useGameLoop` unificado            |
| Código repetitivo de fetching                       | Fetching centralizado                   |

---

## Arquitetura

```
lib/game-engine/
├── index.ts          # Exports públicos
├── types.ts          # Definições de tipos
├── state-machine.ts  # Máquina de estados
├── transitions.ts    # Funções de transição
└── hooks.ts          # Hook useGameLoop
```

### Diagrama de Estados

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    ROOM STATUS                          │
                    ├─────────────────────────────────────────────────────────┤
                    │                                                         │
                    │   waiting ──(startGame)──► playing ──(endSession)──►    │
                    │                              │         game_finished    │
                    │                              │                          │
                    └──────────────────────────────┼──────────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────┐
                    │                    GAME STATUS                          │
                    ├──────────────────────────────┼──────────────────────────┤
                    │                              ▼                          │
                    │                           reveal                        │
                    │                              │                          │
                    │                    (acknowledgeRole)                    │
                    │                              │                          │
                    │              ┌───────────────▼───────────────┐          │
                    │              │                               │          │
                    │              ▼                               │          │
                    │           voting                             │          │
                    │              │                               │          │
                    │      (processVoteResult)                     │          │
                    │              │                               │          │
                    │              ▼                               │          │
                    │         vote_result                          │          │
                    │              │                               │          │
                    │     (proceedToConclusion)                    │          │
                    │              │                               │          │
                    │              ▼                               │          │
                    │       vote_conclusion ──────────────────────►│          │
                    │              │            (startNextRound)   │          │
                    │          (endGame)                                      │
                    │              │                                          │
                    │              ▼                                          │
                    │          game_over ──(playAgain)──► reveal              │
                    │                                                         │
                    └─────────────────────────────────────────────────────────┘
```

---

## Tipos Principais

### Fases

```typescript
// Status da sala (macro)
type RoomPhase = "waiting" | "playing" | "game_finished";

// Status do jogo (micro)
type GamePhase =
  | "reveal"
  | "voting"
  | "vote_result"
  | "vote_conclusion"
  | "game_over";

// O que o usuário vê (UI)
type ViewPhase =
  | "joining" // Precisa entrar na sala
  | "lobby" // Aguardando início
  | "reveal" // Vendo role/palavra
  | "waiting_for_start" // Aguardando outros confirmarem role
  | "voting" // Votando
  | "vote_result" // Resultado da votação
  | "vote_conclusion" // Resultado da eliminação (se era impostor ou não)
  | "game_over" // Fim do jogo
  | "room_ended"; // Sessão encerrada
```

### Lógica de ViewPhase

| ViewPhase           | Condição                        |
| :------------------ | :------------------------------ |
| `joining`           | Sem sala ou sem jogador atual   |
| `lobby`             | Room status = `waiting`         |
| `reveal`            | Game status = `reveal`          |
| `waiting_for_start` | Game status = `reveal` + Ack    |
| `voting`            | Game status = `voting`          |
| `vote_result`       | Game status = `vote_result`     |
| `vote_conclusion`   | Game status = `vote_conclusion` |
| `game_over`         | Game status = `game_over`       |
| `room_ended`        | Room status = `game_finished`   |

### Resultado de Transição

```typescript
interface TransitionResult {
  success: boolean;
  error?: string;
  newPhase?: GamePhase | RoomPhase;
}
```

---

## Uso do Hook

### Importação

```typescript
import { useGameLoop } from "@/lib/game-engine";
```

### Exemplo Completo

```tsx
function RoomPage() {
  const roomCode = "ABCD";

  const {
    // === Estado ===
    room, // Room | null
    game, // Game | null
    currentRound, // Round | null
    players, // Player[]
    gamePlayers, // GamePlayerWithPlayer[]
    viewPhase, // ViewPhase

    // === Computados ===
    currentPlayer, // Player | null
    currentGamePlayer, // GamePlayerWithPlayer | null
    isHost, // boolean
    isImpostor, // boolean

    // === Loading ===
    isLoading, // boolean - carregamento inicial
    isInitialized, // boolean - hook inicializado
    isTransitioning, // boolean - transição em andamento

    // === Ações ===
    startGame, // (word: string) => Promise<TransitionResult>
    advanceToVoting, // () => Promise<TransitionResult>
    processVoteResult, // () => Promise<TransitionResult>
    proceedToConclusion, // (eliminatedPlayerId?: string) => Promise<TransitionResult>
    startNextRound, // () => Promise<TransitionResult>
    endGame, // () => Promise<TransitionResult>
    playAgain, // (newWord: string) => Promise<TransitionResult>
    endSession, // () => Promise<TransitionResult>
    acknowledgeRole, // () => void (local only)
    refresh, // () => Promise<void>
  } = useGameLoop(roomCode);

  // Renderização baseada em viewPhase
  switch (viewPhase) {
    case "joining":
      return <JoinRoomForm />;
    case "lobby":
      return <Lobby onStart={(word) => startGame(word)} />;
    case "reveal":
      return <GameScreen onReady={acknowledgeRole} />;
    case "voting":
      return <VotingScreen />;
    case "vote_result":
      return <VoteResultScreen onContinue={proceedToConclusion} />;
    case "vote_conclusion":
      return (
        <VoteConclusionScreen
          onNextRound={startNextRound}
          onEndGame={endGame}
        />
      );
    case "game_over":
      return (
        <ResultsScreen onPlayAgain={playAgain} onEndSession={endSession} />
      );
    case "room_ended":
      return <SessionEndedScreen />;
  }
}
```

---

## State Machine

### Validação de Transições

```typescript
import { canTransitionGame, canTransitionRoom } from "@/lib/game-engine";

// Verifica se a transição é válida
if (canTransitionGame("voting", "vote_result")) {
  // ok, transição válida
}

if (!canTransitionGame("reveal", "game_over")) {
  // erro, transição inválida
}
```

### Transições Válidas

#### Room

| De        | Para            | Ação           |
| :-------- | :-------------- | :------------- |
| `waiting` | `playing`       | `startGame()`  |
| `playing` | `game_finished` | `endSession()` |

#### Game

| De                | Para              | Ação                      |
| :---------------- | :---------------- | :------------------------ |
| `reveal`          | `voting`          | `advanceToVoting()`       |
| `voting`          | `vote_result`     | `processVoteResult()`     |
| `vote_result`     | `vote_conclusion` | `proceedToConclusion()`   |
| `vote_conclusion` | `voting`          | `startNextRound()`        |
| `vote_conclusion` | `game_over`       | `endGame()`               |
| `game_over`       | `reveal`          | `playAgain()` (novo jogo) |

---

## Funções de Transição

As funções de transição podem ser usadas diretamente se necessário:

```typescript
import {
  startGame,
  endSession,
  advanceToVoting,
  processVoteResult,
  proceedToConclusion,
  startNextRound,
  endGame,
  playAgain,
} from "@/lib/game-engine";

// Uso direto (validação incluída)
const result = await startGame(room, "banana", players);
if (!result.success) {
  console.error(result.error);
}
```

---

## Helpers

### Funções Utilitárias

```typescript
import {
  isGameEnding, // (phase) => boolean - é fase final?
  isVotingPhase, // (phase) => boolean - é fase de votação?
  isResultsPhase, // (phase) => boolean - é fase de resultados?
  getNaturalNextPhase, // (phase) => GamePhase | null - próxima fase natural
  getNextGamePhases, // (phase) => GamePhase[] - possíveis próximas fases
  formatTransitionError, // (error, from?, to?) => string - mensagem de erro
} from "@/lib/game-engine";
```

---

## Realtime

O hook gerencia automaticamente as subscriptions do Supabase:

- Mudanças na sala (`rooms`)
- Mudanças em jogadores (`players`)
- Mudanças no jogo (`games`)
- Mudanças em rounds (`rounds`)

Quando qualquer dado muda, o estado é automaticamente atualizado.

---

## Reconhecimento de Role (Local)

O reconhecimento de role é armazenado localmente via `localStorage`, mas o banco de dados já suporta sincronização via campo `role_acknowledged` em `game_players`.

```typescript
// Chave: impostor_ack_{gameId}_{roundId}
// Valor: "true"

// Uso via hook
acknowledgeRole(); // Marca como reconhecido e muda viewPhase para "voting"
// Futuro: Sincronizar com DB para que o host saiba quem já viu
```

Isso permite que cada jogador avance individualmente para a tela de votação sem esperar pelos outros.

---

## Tratamento de Erros

Todas as transições retornam `TransitionResult`:

```typescript
const result = await startGame("banana");

if (result.success) {
  console.log("Jogo iniciado, nova fase:", result.newPhase);
} else {
  // Possíveis erros:
  // - "Invalid transition from X to Y"
  // - "Only the host can perform this action"
  // - "At least 3 players are required"
  // - "Database operation failed"
  console.error(result.error);
}
```

---

## Configuração

```typescript
import { DEFAULT_GAME_CONFIG } from "@/lib/game-engine";

// {
//   minPlayers: 3,
//   maxPlayers: 20,
//   minRoundsToEnd: 1,
// }
```
