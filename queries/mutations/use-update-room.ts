"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateRoomStatus,
  updateRoomForGameStart,
  updateRoomForNextRound,
  updateRoomEnded,
  resetRoomToWaiting,
} from "@/lib/supabase";

type RoomStatus = "waiting" | "playing" | "voting" | "ended";

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      status,
    }: {
      roomId: string;
      status: RoomStatus;
    }) => {
      const { error } = await updateRoomStatus(roomId, status);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useStartGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      round,
      word,
    }: {
      roomId: string;
      round: number;
      word: string;
    }) => {
      const { error } = await updateRoomForGameStart(roomId, round, word);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useNextRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      round,
    }: {
      roomId: string;
      round: number;
    }) => {
      const { error } = await updateRoomForNextRound(roomId, round);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useEndGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await updateRoomEnded(roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useResetRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await resetRoomToWaiting(roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
