-- Database Improvements for Game Engine

-- 1. Add checks for missing columns and add them gracefully
-- Note: These run on standard PostgreSQL.

-- Table: game_players
-- Add is_eliminated if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'is_eliminated') THEN
        ALTER TABLE game_players ADD COLUMN is_eliminated BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add role_acknowledged if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'role_acknowledged') THEN
        ALTER TABLE game_players ADD COLUMN role_acknowledged BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Table: games
-- Add winner if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'winner') THEN
        ALTER TABLE games ADD COLUMN winner VARCHAR;
    END IF;
END $$;

-- Add ended_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'ended_at') THEN
        ALTER TABLE games ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Table: rounds
-- Add ended_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rounds' AND column_name = 'ended_at') THEN
        ALTER TABLE rounds ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);

-- Optional: Comments for documentation
COMMENT ON COLUMN game_players.is_eliminated IS 'Indicates if the player has been eliminated from the active game.';
COMMENT ON COLUMN game_players.role_acknowledged IS 'Indicates if the player has acknowledged their role/screen.';
COMMENT ON COLUMN games.winner IS 'The winner of the game: "impostor" or "players".';
