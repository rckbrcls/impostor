/**
 * Game Loop State Machine
 *
 * Defines valid state transitions for Room and Game phases.
 * Provides validation functions to ensure only valid transitions occur.
 */

import type { RoomPhase, GamePhase, TransitionError } from "./types";

// ============ Transition Maps ============

/**
 * Valid transitions for Room status
 *
 * waiting → playing (host starts game)
 * playing → game_finished (host ends session)
 * game_finished → waiting (reset, currently not used)
 */
export const ROOM_TRANSITIONS: Record<RoomPhase, RoomPhase[]> = {
  waiting: ["playing"],
  playing: ["game_finished", "waiting"], // waiting for "reset"
  game_finished: ["waiting"],
};

/**
 * Valid transitions for Game status
 *
 * reveal → voting (players ready)
 * voting → vote_result (all votes cast)
 * vote_result → vote_conclusion (host proceeds)
 * vote_conclusion → voting (next round)
 * vote_conclusion → game_over (impostor caught or wins)
 * game_over → reveal (play again, new game)
 */
export const GAME_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  reveal: ["voting"],
  voting: ["vote_result"],
  vote_result: ["vote_conclusion"],
  vote_conclusion: ["voting", "game_over"],
  game_over: ["reveal"], // Actually creates new game
};

// ============ Validation Functions ============

/**
 * Check if a room transition is valid
 */
export function canTransitionRoom(from: RoomPhase, to: RoomPhase): boolean {
  const validTransitions = ROOM_TRANSITIONS[from];
  return validTransitions?.includes(to) ?? false;
}

/**
 * Check if a game transition is valid
 */
export function canTransitionGame(from: GamePhase, to: GamePhase): boolean {
  const validTransitions = GAME_TRANSITIONS[from];
  return validTransitions?.includes(to) ?? false;
}

/**
 * Validate room transition and return error if invalid
 */
export function validateRoomTransition(
  from: RoomPhase,
  to: RoomPhase,
): TransitionError | null {
  if (from === to) {
    return "ALREADY_IN_PHASE";
  }
  if (!canTransitionRoom(from, to)) {
    return "INVALID_TRANSITION";
  }
  return null;
}

/**
 * Validate game transition and return error if invalid
 */
export function validateGameTransition(
  from: GamePhase,
  to: GamePhase,
): TransitionError | null {
  if (from === to) {
    return "ALREADY_IN_PHASE";
  }
  if (!canTransitionGame(from, to)) {
    return "INVALID_TRANSITION";
  }
  return null;
}

// ============ Helper Functions ============

/**
 * Get possible next phases for a game state
 */
export function getNextGamePhases(current: GamePhase): GamePhase[] {
  return GAME_TRANSITIONS[current] ?? [];
}

/**
 * Get possible next phases for a room state
 */
export function getNextRoomPhases(current: RoomPhase): RoomPhase[] {
  return ROOM_TRANSITIONS[current] ?? [];
}

/**
 * Check if current game phase is an ending phase
 */
export function isGameEnding(phase: GamePhase): boolean {
  return phase === "game_over";
}

/**
 * Check if current game phase allows voting
 */
export function isVotingPhase(phase: GamePhase): boolean {
  return phase === "voting";
}

/**
 * Check if current game phase is showing results
 */
export function isResultsPhase(phase: GamePhase): boolean {
  return (
    phase === "vote_result" ||
    phase === "vote_conclusion" ||
    phase === "game_over"
  );
}

/**
 * Get the natural next phase in the game flow
 * This is the "happy path" - the most common next state
 */
export function getNaturalNextPhase(current: GamePhase): GamePhase | null {
  switch (current) {
    case "reveal":
      return "voting";
    case "voting":
      return "vote_result";
    case "vote_result":
      return "vote_conclusion";
    case "vote_conclusion":
      return "voting"; // Default to next round, could also be game_over
    case "game_over":
      return null; // End of line, need explicit action
    default:
      return null;
  }
}

/**
 * Format transition error message
 */
export function formatTransitionError(
  error: TransitionError,
  from?: string,
  to?: string,
): string {
  switch (error) {
    case "INVALID_TRANSITION":
      return `Invalid transition${from && to ? ` from "${from}" to "${to}"` : ""}`;
    case "NOT_HOST":
      return "Only the host can perform this action";
    case "MISSING_DATA":
      return "Required data is missing";
    case "DATABASE_ERROR":
      return "Database operation failed";
    case "ALREADY_IN_PHASE":
      return `Already in phase "${from}"`;
    default:
      return "Unknown error occurred";
  }
}
