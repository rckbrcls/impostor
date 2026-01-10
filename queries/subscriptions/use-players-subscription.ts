"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";

export function usePlayersSubscription(roomId: string | undefined) {
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`players-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Invalidate players query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ["players", roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, queryClient]);
}
