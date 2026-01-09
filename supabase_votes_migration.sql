-- ===========================================
-- VOTING SYSTEM - DATABASE MIGRATION
-- ===========================================
-- Execute este script no SQL Editor do Supabase
-- ===========================================

-- 1. Criar tabela de votos
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  round INTEGER NOT NULL,
  voter_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,

  -- Voto de quem é o impostor (player_id do suspeito)
  impostor_vote UUID REFERENCES players(id) ON DELETE SET NULL,

  -- Voto de ação: 'next_round' | 'end_game'
  action_vote TEXT CHECK (action_vote IN ('next_round', 'end_game')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Cada jogador só pode votar uma vez por rodada
  UNIQUE(room_id, round, voter_id)
);

-- 2. Habilitar RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 3. Policies para a tabela votes
-- Policy: qualquer um pode ler votos
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

-- Policy: qualquer um pode inserir votos
CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Policy: qualquer um pode atualizar votos
CREATE POLICY "Anyone can update votes"
  ON votes FOR UPDATE
  USING (true);

-- 4. Atualizar constraint de status na tabela rooms (se necessário)
-- Primeiro, remova o constraint existente (se houver)
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_status_check;

-- Adicione o novo constraint com 'voting'
ALTER TABLE rooms
ADD CONSTRAINT rooms_status_check
CHECK (status IN ('waiting', 'playing', 'voting', 'ended'));

-- ===========================================
-- IMPORTANTE: Após executar este script,
-- vá em Database -> Replication e habilite
-- Realtime para a tabela 'votes'
-- ===========================================
