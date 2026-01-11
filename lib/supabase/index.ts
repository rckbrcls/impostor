// Re-export everything for backward compatibility
export { supabase } from "./client";
export type { Room, Player, Vote } from "./types";
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
  updateRoomStatus,
  updateRoomForGameStart,
  updateRoomForNextRound,
  updateRoomEnded,
  resetRoomToWaiting,
  updateRoomHost,
  deleteRoom,
  subscribeToRoom,
} from "./rooms";

// Player operations
export {
  addPlayer,
  removePlayer,
  getPlayersByRoomId,
  getPlayerByRoomAndClient,
  updatePlayerAsImpostor,
  resetPlayersForNewRound,
  resetPlayersForNewGame,
  eliminatePlayer,
  subscribeToPlayers,
} from "./players";

// Vote operations
export {
  getVotesByRoomAndRound,
  upsertVote,
  deleteVotesByRoomId,
  deleteVotesByVoter,
  subscribeToVotes,
} from "./votes";
