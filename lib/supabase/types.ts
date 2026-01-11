// Types for database tables

export interface Room {
  id: string;
  code: string;
  host_id: string;
  created_at: string;
  status?: "waiting" | "playing" | "game_finished";
}

export interface Player {
  id: string;
  room_id: string;
  client_id: string;
  name: string;
  score: number;
  joined_at: string;
}

export interface Game {
  id: string;
  room_id: string;
  status: "waiting" | "reveal" | "voting" | "vote_result" | "game_over";
  word: string;
  current_round: number;
  created_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  is_impostor: boolean;
}

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  eliminated_player_id: string | null;
  majority_action: "next_round" | "end_game" | null;
  created_at: string;
}

export interface Vote {
  id: string;
  round_id: string;
  voter_id: string;
  target_player_id: string | null;
  action_vote: "next_round" | "end_game" | null;
  is_action_vote: boolean;
  created_at: string;
}
