// Types for database tables
export interface Room {
  id: string;
  code: string;
  word: string | null;
  host_id: string;
  status: "waiting" | "playing" | "voting" | "ended";
  round: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  client_id: string;
  name: string;
  is_impostor: boolean;
  is_eliminated: boolean;
  score: number;
  joined_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  round: number;
  voter_id: string;
  impostor_vote: string | null;
  action_vote: "next_round" | "end_game" | null;
  created_at: string;
}
