"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/database.types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export function useRoomSubscription(roomId: string | undefined) {
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newRoom = payload.new as Room;

          // Update the room query cache directly
          queryClient.setQueryData(["rooms", newRoom.code], newRoom);

          // Also invalidate to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, queryClient]);
}
