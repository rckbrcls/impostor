"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";

export function useVotesSubscription(
  roomId: string | undefined,
  round: number | undefined
) {
  const supabase = useSupabaseBrowser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId || round === undefined) return;

    const channel = supabase
      .channel(`votes-${roomId}-${round}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Invalidate votes query to trigger refetch
          queryClient.invalidateQueries({
            queryKey: ["votes", roomId, round],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, round, supabase, queryClient]);
}
