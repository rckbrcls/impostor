-- Add 'waiting_for_start' to the valid statuses for games
ALTER TABLE games
DROP CONSTRAINT IF EXISTS games_status_check;

ALTER TABLE games
ADD CONSTRAINT games_status_check
CHECK (status IN (
  'waiting',
  'reveal',
  'waiting_for_start',
  'voting',
  'vote_conclusion',
  'vote_result',
  'game_over'
));
