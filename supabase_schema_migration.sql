-- ================================================================
-- DATABASE SCHEMA REFACTORING MIGRATION
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. CREATE NEW TABLES
-- ================================================================

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'playing',
    word TEXT,
    current_round INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON games FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Game Players table
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    is_impostor BOOLEAN DEFAULT false,
    UNIQUE(game_id, player_id)
);

ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON game_players FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE game_players;

-- Rounds table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    eliminated_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    majority_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, round_number)
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON rounds FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;

-- 2. RECREATE VOTES TABLE
-- ================================================================

DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    target_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    action_vote TEXT,
    is_action_vote BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round_id, voter_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON votes FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- 3. MODIFY EXISTING TABLES
-- ================================================================

-- Remove game-specific columns from rooms
ALTER TABLE rooms DROP COLUMN IF EXISTS round;
ALTER TABLE rooms DROP COLUMN IF EXISTS status;
ALTER TABLE rooms DROP COLUMN IF EXISTS word;

-- Remove game-specific columns from players
ALTER TABLE players DROP COLUMN IF EXISTS is_impostor;
ALTER TABLE players DROP COLUMN IF EXISTS is_eliminated;
