import { TypedSupabaseClient } from "@/lib/supabase/browser";

export async function getActiveGame(
  client: TypedSupabaseClient,
  roomId: string,
) {
  const { data, error } = await client
    .from("games")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
}
