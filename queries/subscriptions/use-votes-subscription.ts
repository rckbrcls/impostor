"use client";

import { useSubscription } from "@supabase-cache-helpers/postgrest-react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";

export function useVotesSubscription(
  roomId: string | undefined,
  round: number | undefined
) {
  const supabase = useSupabaseBrowser();

  useSubscription(
    roomId ? supabase : null,
    `votes-${roomId ?? "none"}-${round ?? 0}`,
    {
      event: "*",
      schema: "public",
      table: "votes",
      filter: roomId ? `room_id=eq.${roomId}` : undefined,
    },
    ["id"],
    {
      callback: (payload) => {
        console.log("Votes realtime update:", payload);
      },
    }
  );
}
