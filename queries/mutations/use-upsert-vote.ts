"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertVote } from "@/lib/supabase";

interface UpsertVoteParams {
  roomId: string;
  round: number;
  voterId: string;
  impostorVote: string | null;
  actionVote: "next_round" | "end_game" | null;
}

export function useUpsertVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      round,
      voterId,
      impostorVote,
      actionVote,
    }: UpsertVoteParams) => {
      const { error } = await upsertVote(
        roomId,
        round,
        voterId,
        impostorVote,
        actionVote
      );
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["votes", variables.roomId, variables.round],
      });
    },
  });
}
