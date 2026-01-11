"use client";

import { useSubscription } from "@supabase-cache-helpers/postgrest-react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";

export function usePlayersSubscription(roomId: string | undefined) {
  const supabase = useSupabaseBrowser();

  console.log(
    "[DEBUG usePlayersSubscription] Hook called with roomId:",
    roomId
  );

  useSubscription(
    roomId ? supabase : null,
    `players-${roomId ?? "none"}`,
    {
      event: "*",
      schema: "public",
      table: "players",
      filter: roomId ? `room_id=eq.${roomId}` : undefined,
    },
    ["id"],
    {
      callback: (payload) => {
        console.log(
          "[DEBUG usePlayersSubscription] Realtime update received:",
          payload
        );
      },
    }
  );

  console.log(
    "[DEBUG usePlayersSubscription] Subscription configured for channel:",
    `players-${roomId ?? "none"}`
  );
}
