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

  return useMutation({
    mutationFn: async ({ roomId, clientId, name }: AddPlayerParams) => {
      const { error } = await addPlayer(roomId, clientId, name);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["players", variables.roomId],
      });
    },
  });
}
