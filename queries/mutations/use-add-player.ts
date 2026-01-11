"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPlayer } from "@/lib/supabase";

interface AddPlayerParams {
  roomId: string;
  clientId: string;
  name: string;
}

export function useAddPlayer() {
  const queryClient = useQueryClient();

  console.log("[DEBUG useAddPlayer] Hook initialized");

  return useMutation({
    mutationFn: async ({ roomId, clientId, name }: AddPlayerParams) => {
      console.log("[DEBUG useAddPlayer] Mutation executing:", {
        roomId,
        clientId,
        name,
      });
      const { error } = await addPlayer(roomId, clientId, name);
      if (error) {
        console.error("[DEBUG useAddPlayer] Mutation error:", error);
        throw error;
      }
      console.log("[DEBUG useAddPlayer] Mutation successful");
    },
    onSuccess: (_, variables) => {
      console.log(
        "[DEBUG useAddPlayer] onSuccess - invalidating queries for roomId:",
        variables.roomId
      );
      queryClient.invalidateQueries({
        queryKey: ["players", variables.roomId],
      });
      console.log("[DEBUG useAddPlayer] Queries invalidated");
    },
    onError: (error) => {
      console.error("[DEBUG useAddPlayer] onError:", error);
    },
  });
}
