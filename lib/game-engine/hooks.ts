/**
 * Game Loop Hook
 *
 * Main hook for managing the game loop state and actions.
 * Provides a unified interface for all game operations.
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useSupabaseBrowser from "@/lib/supabase/browser";
import {
  getRoomByCode,
  getActiveGame,
  getPlayersByRoom,
  getCurrentRound,
  getGamePlayers,
} from "@/queries";
import { getClientId } from "@/lib/game-utils";
import { setPlayerAcknowledged } from "@/lib/supabase";
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
  checkAndAdvanceToWaiting,
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
  dbAckedRole: boolean,
): ViewPhase {
  if (!room) return "joining";
  if (!currentPlayer) return "joining";

  if (room.status === "game_finished") return "room_ended";
  if (!game) return "lobby";

  if (game.status === "game_over") return "game_over";

  // Map game status to view phase
  switch (game.status) {
    case "reveal":
      return "reveal";
    case "waiting_for_start":
      return "waiting_for_start";
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

  const viewPhase = calculateViewPhase(
    room,
    game,
    currentPlayer,
    hasAckedRole,
    currentGamePlayer?.role_acknowledged ?? false,
  );

  // Update refs
  useEffect(() => {
    roomRef.current = room;
    playerRef.current = currentPlayer;
  }, [room, currentPlayer]);

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

  const fetchGameData = useCallback(
    async (overrideRoomId?: string) => {
      const targetRoomId = overrideRoomId || room?.id;
      if (!targetRoomId) return;

      try {
        // 1. Fetch active game
        const { data: gameData } = await getActiveGame(supabase, targetRoomId);
        setGame(gameData as Game);

        // 2. Fetch players
        const { data: playersData } = await getPlayersByRoom(
          supabase,
          targetRoomId,
        );
        setPlayers((playersData as Player[]) || []);

        // 3. Fetch specific game details if game exists
        if (gameData) {
          const { data: roundData } = await getCurrentRound(
            supabase,
            gameData.id,
            gameData.current_round ?? 1,
          );
          setCurrentRound(roundData as Round);

          const { data: gpData } = await getGamePlayers(supabase, gameData.id);
          setGamePlayers(gpData);
        } else {
          setCurrentRound(null);
          setGamePlayers([]);
        }
      } catch (error) {
        console.error("[useGameLoop] Error fetching game data:", error);
      }
    },
    [supabase, room?.id],
  );

  const refresh = useCallback(async () => {
    await fetchRoom();
    await fetchGameData();
  }, [fetchRoom, fetchGameData]);

  // ============ Initialization ============

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      const roomData = await fetchRoom();
      if (roomData) {
        // Pass roomData.id directly to avoid waiting for state update
        await fetchGameData(roomData.id);
      }
      setIsInitialized(true);
      setIsLoading(false);
    }
    initialize();
  }, []); // Run once on mount

  // Watch for room changes AFTER initialization (e.g. navigation or updates)
  useEffect(() => {
    if (isInitialized && room?.id) {
      fetchGameData();
    }
  }, [room?.id, fetchGameData, isInitialized]);

  // ============ Role Acknowledgement ============

  useEffect(() => {
    if (!game?.id || !currentRound?.id) return;
    const key = getAckKey(game.id, currentRound.id);
    const savedAck = localStorage.getItem(key) === "true";
    const dbAck = currentGamePlayer?.role_acknowledged ?? false;

    if (savedAck || dbAck) {
      setHasAckedRole(true);
    }
  }, [game?.id, currentRound?.id, currentGamePlayer?.role_acknowledged]);

  const acknowledgeRole = useCallback(() => {
    if (!game?.id || !currentRound?.id || !currentPlayer?.id) return;
    const key = getAckKey(game.id, currentRound.id);
    localStorage.setItem(key, "true");
    setHasAckedRole(true);

    // Sync with DB and check if everyone is ready
    setPlayerAcknowledged(game.id, currentPlayer.id)
      .then(async () => {
        // We pass the game object, but we need to make sure we're using the latest state
        // However, for the id and status check (inside transition), the current game object is fine
        // provided the status hasn't changed from reveal (which it shouldn't have yet)
        if (game.status === "reveal") {
          await checkAndAdvanceToWaiting(game);
        }
      })
      .catch(console.error);
  }, [game, currentRound?.id, currentPlayer?.id]);

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

  // Game Players subscription (for readiness/elimination updates)
  useEffect(() => {
    if (!game?.id) return;

    const channel = supabase
      .channel(`gameloop-game-players-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${game.id}`,
        },
        () => fetchGameData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, game?.id, fetchGameData]);

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

  const endGameAction = useCallback(
    async (winner: "impostor" | "players"): Promise<TransitionResult> => {
      if (!game) return { success: false, error: "No game available" };
      return withTransition(() => transitionEndGame(game, winner));
    },
    [game, withTransition],
  );

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
