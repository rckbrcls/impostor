import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { useMemo } from "react";

export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

let client: TypedSupabaseClient | undefined;

function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );

  return client;
}

function useSupabaseBrowser() {
  return useMemo(getSupabaseBrowserClient, []);
}

export default useSupabaseBrowser;
