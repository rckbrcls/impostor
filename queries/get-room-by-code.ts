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
      status
    `,
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

  return {
    data: {
      ...data,
      status: data.status || "waiting",
    },
    error: null,
  };
}
