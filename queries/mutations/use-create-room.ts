"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom, getRoomIdByCode } from "@/lib/supabase";

interface CreateRoomParams {
  code: string;
  hostId: string;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, hostId }: CreateRoomParams) => {
      const { error } = await createRoom(code, hostId);
      if (error) throw error;

      // Get the room ID to return
      const { data, error: getError } = await getRoomIdByCode(code);
      if (getError) throw getError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
