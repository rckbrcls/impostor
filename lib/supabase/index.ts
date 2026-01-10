// Re-export everything for backward compatibility
export { supabase } from "./client";
export type { Room, Player, Vote } from "./types";

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
  subscribeToRoom,
} from "./rooms";

// Player operations
export {
  addPlayer,
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
