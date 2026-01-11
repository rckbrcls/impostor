import { TypedSupabaseClient } from "@/lib/supabase/browser";

export async function getRoomByCode(client: TypedSupabaseClient, code: string) {
  const { data, error } = await client
    .from("rooms")
    .select(
      `
      id,
      code,
      host_id,
      created_at,
      games (
        status
      )
    `
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: { message: "Room not found", details: "", hint: "", code: "404" },
    };
  }

  // Check if there is any active game
  // We consider 'playing' or 'voting' as active statuses
  const games = data.games as unknown as { status: string }[];
  const hasActiveGame = games?.some(
    (g) => g.status === "playing" || g.status === "voting"
  );

  return {
    data: {
      ...data,
      status: hasActiveGame ? "playing" : "waiting",
    },
    error: null,
  };
}
