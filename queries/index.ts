// Reusable query functions for React Query with Supabase
// These can be used with both browser and server Supabase clients

// Query functions
export { getRoomByCode } from "./get-room-by-code";
export { getPlayersByRoom } from "./get-players-by-room";
export { getPlayerByClient } from "./get-player-by-client";
export { getVotesByRoomRound } from "./get-votes-by-room-round";

// Mutation hooks
export * from "./mutations";

// Subscription hooks
export * from "./subscriptions";
