-- Add status column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';

-- Update existing rooms to have a status
UPDATE rooms SET status = 'waiting' WHERE status IS NULL;

-- Make it check for valid values (optional but good practice)
ALTER TABLE rooms ADD CONSTRAINT check_room_status CHECK (status IN ('waiting', 'playing', 'game_finished'));
