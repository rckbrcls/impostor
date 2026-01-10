"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVotesByRoomId, deleteVotesByVoter } from "@/lib/supabase";

export function useDeleteVotesByRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await deleteVotesByRoomId(roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes"] });
    },
  });
}

export function useDeleteVotesByVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      voterId,
    }: {
      roomId: string;
      voterId: string;
    }) => {
      const { error } = await deleteVotesByVoter(roomId, voterId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["votes", variables.roomId] });
    },
  });
}
