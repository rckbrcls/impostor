"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updatePlayerAsImpostor,
  resetPlayersForNewRound,
  resetPlayersForNewGame,
  eliminatePlayer,
} from "@/lib/supabase";

export function useSetImpostor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      roomId,
    }: {
      playerId: string;
      roomId: string;
    }) => {
      const { error } = await updatePlayerAsImpostor(playerId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["players", variables.roomId],
      });
    },
  });
}

export function useEliminatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      roomId,
    }: {
      playerId: string;
      roomId: string;
    }) => {
      const { error } = await eliminatePlayer(playerId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["players", variables.roomId],
      });
    },
  });
}

export function useResetPlayersForRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await resetPlayersForNewRound(roomId);
      if (error) throw error;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["players", roomId] });
    },
  });
}

export function useResetPlayersForGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await resetPlayersForNewGame(roomId);
      if (error) throw error;
    },
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ["players", roomId] });
    },
  });
}
