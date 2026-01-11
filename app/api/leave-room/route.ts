import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { playerId, roomId } = await request.json();

    if (!playerId || !roomId) {
      return NextResponse.json(
        { error: "Missing playerId or roomId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Delete player
    await supabase.from("players").delete().eq("id", playerId);

    // Check if room is empty
    const { count } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count === 0) {
      // Delete votes first (FK constraint)
      await supabase.from("votes").delete().eq("room_id", roomId);
      // Delete the empty room
      await supabase.from("rooms").delete().eq("id", roomId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[leave-room API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
