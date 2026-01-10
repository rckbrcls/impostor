import { TypedSupabaseClient } from "@/lib/supabase/browser";

export function getRoomByCode(client: TypedSupabaseClient, code: string) {
  return client
    .from("rooms")
    .select(
      `
      id,
      code,
      word,
      host_id,
      status,
      round,
      created_at
    `
    )
    .eq("code", code.toUpperCase())
    .throwOnError()
    .single();
}
