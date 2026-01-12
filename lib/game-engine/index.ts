/**
 * Game Loop Engine
 *
 * Centralized engine for managing game state, transitions, and actions.
 *
 * @example
 * ```tsx
 * import { useGameLoop } from "@/lib/game-engine";
 *
 * function GamePage({ roomCode }: { roomCode: string }) {
 *   const {
 *     viewPhase,
 *     room,
 *     game,
 *     currentPlayer,
 *     isHost,
 *     startGame,
 *     endGame,
 *   } = useGameLoop(roomCode);
 *
 *   if (viewPhase === "lobby") {
 *     return <Lobby onStart={() => startGame("apple")} />;
 *   }
 *   // ...
 * }
 * ```
 */

// Types
export type {
  RoomPhase,
  GamePhase,
  ViewPhase,
  GameLoopState,
  TransitionResult,
  TransitionError,
  GameLoopActions,
  UseGameLoopReturn,
  GameConfig,
} from "./types";

export { DEFAULT_GAME_CONFIG } from "./types";

// State Machine
export {
  ROOM_TRANSITIONS,
  GAME_TRANSITIONS,
  canTransitionRoom,
  canTransitionGame,
  validateRoomTransition,
  validateGameTransition,
  getNextGamePhases,
  getNextRoomPhases,
  isGameEnding,
  isVotingPhase,
  isResultsPhase,
  getNaturalNextPhase,
  formatTransitionError,
} from "./state-machine";

export { calculateVotingOutcome, type VotingOutcome } from "./voting-logic";

// Transitions (for direct use if needed)
export {
  startGame,
  endSession,
  advanceToVoting,
  processVoteResult,
  proceedToConclusion,
  startNextRound,
  endGame,
  playAgain,
  fetchGameLoopData,
} from "./transitions";

// Main Hook
export { useGameLoop } from "./hooks";
