/**
 * Game Loop Engine Types
 *
 * Centralized type definitions for the game state machine and transitions.
 */

import type {
  Room,
  Game,
  Round,
  Player,
  GamePlayer,
} from "@/lib/supabase/types";
import type { GamePlayerWithPlayer } from "@/lib/supabase/game-players";

// ============ Phase Types ============

/**
 * Room-level phases (macro state)
 */
export type RoomPhase = "waiting" | "playing" | "game_finished";

/**
 * Game-level phases (micro state within a game)
 */
export type GamePhase =
  | "reveal"
  | "voting"
  | "vote_result"
  | "vote_conclusion"
  | "game_over";

/**
 * UI-level view state (what the user sees)
 */
export type ViewPhase =
  | "joining" // User needs to join the room
  | "lobby" // Waiting for game to start
  | "reveal" // Showing role/word
  | "voting" // Casting votes
  | "waiting_for_start" // Waiting for others to acknowledge role
  | "vote_result" // Showing vote results
  | "vote_conclusion" // Individual vote feedback
  | "game_over" // Game ended, showing winner
  | "room_ended"; // Session ended, showing stats

// ============ State Types ============

/**
 * Complete game loop state
 */
export interface GameLoopState {
  // Data
  room: Room | null;
  game: Game | null;
  currentRound: Round | null;
  players: Player[];
  gamePlayers: GamePlayerWithPlayer[];

  // Computed phase
  viewPhase: ViewPhase;

  // Player context
  currentPlayer: Player | null;
  currentGamePlayer: GamePlayerWithPlayer | null;
  isHost: boolean;
  isImpostor: boolean;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
}

/**
 * Result of a state transition
 */
export interface TransitionResult {
  success: boolean;
  error?: string;
  newPhase?: GamePhase | RoomPhase;
}

/**
 * Error types for transitions
 */
export type TransitionError =
  | "INVALID_TRANSITION"
  | "NOT_HOST"
  | "MISSING_DATA"
  | "DATABASE_ERROR"
  | "ALREADY_IN_PHASE";

// ============ Action Types ============

/**
 * Actions available in the game loop
 */
export interface GameLoopActions {
  // Game flow
  startGame: (word: string) => Promise<TransitionResult>;
  advanceToVoting: () => Promise<TransitionResult>;
  processVoteResult: () => Promise<TransitionResult>;
  proceedToConclusion: (
    eliminatedPlayerId?: string,
  ) => Promise<TransitionResult>;
  startNextRound: () => Promise<TransitionResult>;
  endGame: (winner: "impostor" | "players") => Promise<TransitionResult>;
  playAgain: (newWord: string) => Promise<TransitionResult>;
  endSession: () => Promise<TransitionResult>;

  // Local actions
  acknowledgeRole: () => void;

  // Data refresh
  refresh: () => Promise<void>;
}

// ============ Hook Return Type ============

/**
 * Return type for useGameLoop hook
 */
export interface UseGameLoopReturn extends GameLoopState, GameLoopActions {
  isTransitioning: boolean;
}

// ============ Configuration ============

/**
 * Game configuration options
 */
export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  minRoundsToEnd: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 3,
  maxPlayers: 20,
  minRoundsToEnd: 1,
};
