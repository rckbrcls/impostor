"use client";

import { useSubscription } from "@supabase-cache-helpers/postgrest-react-query";
import useSupabaseBrowser from "@/lib/supabase/browser";

export function useRoomSubscription(roomId: string | undefined) {
  const supabase = useSupabaseBrowser();

  useSubscription(
    roomId ? supabase : null,
    `room-${roomId ?? "none"}`,
    {
      event: "*",
      schema: "public",
      table: "rooms",
      filter: roomId ? `id=eq.${roomId}` : undefined,
    },
    ["id"],
    {
      callback: (payload) => {
        console.log("Room realtime update:", payload);
      },
    }
  );
}
