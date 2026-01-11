// Re-export everything for backward compatibility
export { supabase } from "./client";
export type { Room, Player, Game, GamePlayer, Round, Vote } from "./types";
export type { Database } from "./database.types";
export {
  default as useSupabaseBrowser,
  type TypedSupabaseClient,
} from "./browser";

// Room operations
export {
  createRoom,
  getRoomByCode,
  getRoomIdByCode,
  updateRoomHost,
  deleteRoom,
  updateRoomStatus,
  subscribeToRoom,
} from "./rooms";

// Player operations
export {
  addPlayer,
  removePlayer,
  getPlayersByRoomId,
  getPlayerByRoomAndClient,
  getPlayerById,
  updatePlayerScore,
  incrementPlayerScore,
  resetPlayersScores,
  subscribeToPlayers,
} from "./players";

// Game operations
export {
  createGame,
  getActiveGame,
  getGameById,
  updateGameStatus,
  updateGameRound,
  endGame,
  subscribeToGame,
} from "./games";

// Game player operations
export {
  createGamePlayers,
  setImpostor,
  getGamePlayers,
  getGamePlayer,
  isPlayerImpostor,
  setPlayerEliminated,
  setPlayerAcknowledged,
  subscribeToGamePlayers,
  type GamePlayerWithPlayer,
} from "./game-players";

// Round operations
export {
  createRound,
  getCurrentRound,
  getRoundById,
  updateRoundEliminated,
  updateRoundMajorityAction,
  getRoundsByGame,
  subscribeToRound,
} from "./rounds";

// Vote operations
export {
  getVotesByRound,
  submitPlayerVote,
  submitActionVote,
  deleteVote,
  calculateVoteResults,
  subscribeToVotes,
} from "./votes";

// Session stats operations
export {
  getSessionStats,
  type PlayerStats,
  type SessionStats,
} from "./session-stats";
