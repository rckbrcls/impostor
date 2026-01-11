/**
 * Game Loop Hook
 *
 * Main hook for managing the game loop state and actions.
 * Provides a unified interface for all game operations.
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useSupabaseBrowser from "@/lib/supabase/browser";
import { getRoomByCode } from "@/queries";
import { getClientId } from "@/lib/game-utils";
import type { Room, Player, Game, Round } from "@/lib/supabase/types";
import type { GamePlayerWithPlayer } from "@/lib/supabase/game-players";
import type { UseGameLoopReturn, ViewPhase, TransitionResult } from "./types";
import {
  startGame as transitionStartGame,
  endSession as transitionEndSession,
  advanceToVoting as transitionAdvanceToVoting,
  processVoteResult as transitionProcessVoteResult,
  proceedToConclusion as transitionProceedToConclusion,
  startNextRound as transitionStartNextRound,
  endGame as transitionEndGame,
  playAgain as transitionPlayAgain,
  fetchGameLoopData,
} from "./transitions";

// ============ Helper Functions ============

/**
 * Calculate the current view phase based on room and game state
 */
function calculateViewPhase(
  room: Room | null,
  game: Game | null,
  currentPlayer: Player | null,
  hasAckedRole: boolean,
): ViewPhase {
  if (!room) return "joining";
  if (!currentPlayer) return "joining";

  if (room.status === "game_finished") return "room_ended";
  if (!game) return "lobby";

  if (game.status === "game_over") return "game_over";

  // Map game status to view phase
  switch (game.status) {
    case "reveal":
      // If player has acknowledged, show voting
      return hasAckedRole ? "voting" : "reveal";
    case "voting":
      return "voting";
    case "vote_result":
      return "vote_result";
    case "vote_conclusion":
      return "vote_conclusion";
    default:
      return "lobby";
  }
}

/**
 * Get localStorage key for role acknowledgement
 */
function getAckKey(gameId: string, roundId: string): string {
  return `impostor_ack_${gameId}_${roundId}`;
}

// ============ Main Hook ============

/**
 * useGameLoop - Main hook for game loop management
 *
 * @param roomCode - The room code to connect to
 * @returns Complete game state and actions
 */
export function useGameLoop(roomCode: string): UseGameLoopReturn {
  const supabase = useSupabaseBrowser();
  const clientId = getClientId();

  // Core state
  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gamePlayers, setGamePlayers] = useState<GamePlayerWithPlayer[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Local state for role acknowledgement
  const [hasAckedRole, setHasAckedRole] = useState(false);

  // Refs to track current state for cleanup
  const roomRef = useRef<Room | null>(null);
  const playerRef = useRef<Player | null>(null);

  // ============ Data Fetching ============

  const fetchRoom = useCallback(async () => {
    try {
      const { data, error } = await getRoomByCode(supabase, roomCode);
      if (error) {
        console.error("[useGameLoop] Error fetching room:", error);
        return null;
      }
      setRoom(data as Room);
      return data as Room;
    } catch (e) {
      console.error("[useGameLoop] Exception fetching room:", e);
      return null;
    }
  }, [supabase, roomCode]);

  const fetchGameData = useCallback(async () => {
    if (!room?.id) return;

    const data = await fetchGameLoopData(room.id);
    setGame(data.game);
    setCurrentRound(data.currentRound);
    setPlayers(data.players);
    setGamePlayers(data.gamePlayers);
  }, [room?.id]);

  const refresh = useCallback(async () => {
    await fetchRoom();
    await fetchGameData();
  }, [fetchRoom, fetchGameData]);

  // ============ Initialization ============

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      await fetchRoom();
      setIsInitialized(true);
      setIsLoading(false);
    }
    initialize();
  }, [fetchRoom]);

  useEffect(() => {
    if (room?.id) {
      fetchGameData();
    }
  }, [room?.id, fetchGameData]);

  // ============ Role Acknowledgement ============

  useEffect(() => {
    if (!game?.id || !currentRound?.id) return;
    const key = getAckKey(game.id, currentRound.id);
    const savedAck = localStorage.getItem(key) === "true";
    setHasAckedRole(savedAck);
  }, [game?.id, currentRound?.id]);

  const acknowledgeRole = useCallback(() => {
    if (!game?.id || !currentRound?.id) return;
    const key = getAckKey(game.id, currentRound.id);
    localStorage.setItem(key, "true");
    setHasAckedRole(true);
  }, [game?.id, currentRound?.id]);

  // ============ Realtime Subscriptions ============

  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`gameloop-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${room.id}`,
        },
        () => fetchRoom(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${room.id}`,
        },
        () => fetchGameData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `room_id=eq.${room.id}`,
        },
        () => fetchGameData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, room?.id, fetchRoom, fetchGameData]);

  // Rounds subscription (separate because it depends on game)
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`gameloop-rounds-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `game_id=eq.${game.id}`,
        },
        () => fetchGameData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, game?.id, fetchGameData]);

  // ============ Computed Values ============

  const currentPlayer = useMemo(
    () => players.find((p) => p.client_id === clientId) ?? null,
    [players, clientId],
  );

  const currentGamePlayer = useMemo(
    () => gamePlayers.find((gp) => gp.player_id === currentPlayer?.id) ?? null,
    [gamePlayers, currentPlayer?.id],
  );

  const isHost = room?.host_id === clientId;
  const isImpostor = currentGamePlayer?.is_impostor ?? false;

  const viewPhase = calculateViewPhase(room, game, currentPlayer, hasAckedRole);

  // Update refs
  useEffect(() => {
    roomRef.current = room;
    playerRef.current = currentPlayer;
  }, [room, currentPlayer]);

  // ============ Actions ============

  const withTransition = useCallback(
    async (
      action: () => Promise<TransitionResult>,
    ): Promise<TransitionResult> => {
      setIsTransitioning(true);
      try {
        const result = await action();
        if (result.success) {
          await fetchGameData();
        }
        return result;
      } finally {
        setIsTransitioning(false);
      }
    },
    [fetchGameData],
  );

  const startGame = useCallback(
    async (word: string): Promise<TransitionResult> => {
      if (!room) return { success: false, error: "No room available" };
      return withTransition(() => transitionStartGame(room, word, players));
    },
    [room, players, withTransition],
  );

  const advanceToVoting = useCallback(async (): Promise<TransitionResult> => {
    if (!game) return { success: false, error: "No game available" };
    return withTransition(() => transitionAdvanceToVoting(game));
  }, [game, withTransition]);

  const processVoteResult = useCallback(async (): Promise<TransitionResult> => {
    if (!game) return { success: false, error: "No game available" };
    return withTransition(() => transitionProcessVoteResult(game));
  }, [game, withTransition]);

  const proceedToConclusion = useCallback(
    async (eliminatedPlayerId?: string): Promise<TransitionResult> => {
      if (!game || !currentRound)
        return { success: false, error: "No game or round available" };
      return withTransition(() =>
        transitionProceedToConclusion(game, currentRound, eliminatedPlayerId),
      );
    },
    [game, currentRound, withTransition],
  );

  const startNextRound = useCallback(async (): Promise<TransitionResult> => {
    if (!game) return { success: false, error: "No game available" };
    return withTransition(() => transitionStartNextRound(game));
  }, [game, withTransition]);

  const endGameAction = useCallback(async (): Promise<TransitionResult> => {
    if (!game) return { success: false, error: "No game available" };
    return withTransition(() => transitionEndGame(game));
  }, [game, withTransition]);

  const playAgain = useCallback(
    async (newWord: string): Promise<TransitionResult> => {
      if (!room) return { success: false, error: "No room available" };
      return withTransition(() => transitionPlayAgain(room, newWord));
    },
    [room, withTransition],
  );

  const endSession = useCallback(async (): Promise<TransitionResult> => {
    if (!room) return { success: false, error: "No room available" };
    return withTransition(() => transitionEndSession(room));
  }, [room, withTransition]);

  // ============ Return ============

  return {
    // State
    room,
    game,
    currentRound,
    players,
    gamePlayers,
    viewPhase,

    // Computed
    currentPlayer,
    currentGamePlayer,
    isHost,
    isImpostor,

    // Loading
    isLoading,
    isInitialized,
    isTransitioning,

    // Actions
    startGame,
    advanceToVoting,
    processVoteResult,
    proceedToConclusion,
    startNextRound,
    endGame: endGameAction,
    playAgain,
    endSession,
    acknowledgeRole,
    refresh,
  };
}
