'use client'

import { useState, useEffect } from 'react'
import { supabase, type Player, type Room, type Vote } from '@/lib/supabase'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, User, Play, Flag, Loader2 } from 'lucide-react'

interface VotingScreenProps {
  room: Room
  players: Player[]
  currentPlayer: Player | null
  onNextRound: () => void
  onEndGame: () => void
}

export function VotingScreen({ room, players, currentPlayer, onNextRound, onEndGame }: VotingScreenProps) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [myImpostorVote, setMyImpostorVote] = useState<string | null>(null)
  const [myActionVote, setMyActionVote] = useState<'next_round' | 'end_game' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [revealResult, setRevealResult] = useState(false)

  const impostor = players.find((p) => p.is_impostor)
  const totalPlayers = players.length

  // Carregar votos existentes
  useEffect(() => {
    const loadVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', room.id)
        .eq('round', room.round)

      if (data) {
        setVotes(data)
        // Verificar se já votei
        const myVote = data.find((v) => v.voter_id === currentPlayer?.id)
        if (myVote) {
          setMyImpostorVote(myVote.impostor_vote)
          setMyActionVote(myVote.action_vote)
          setHasVoted(true)
        }
      }
    }

    loadVotes()
  }, [room.id, room.round, currentPlayer?.id])

  // Realtime subscription para votos
  useEffect(() => {
    const channel = supabase
      .channel(`votes-${room.id}-${room.round}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          // Recarregar votos
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('room_id', room.id)
            .eq('round', room.round)

          setVotes(data || [])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, room.round])

  // Processar resultados quando todos votarem
  useEffect(() => {
    if (votes.length === totalPlayers && votes.length > 0 && !isProcessing && !revealResult) {
      processVotingResults()
    }
  }, [votes, totalPlayers, isProcessing, revealResult])

  // Contar votos para cada jogador (impostor)
  const getImpostorVoteCount = (playerId: string) => {
    return votes.filter((v) => v.impostor_vote === playerId).length
  }

  // Contar votos de ação
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.action_vote === action).length
  }

  // Jogadores que ainda não votaram
  const pendingVoters = players.filter(
    (p) => !votes.some((v) => v.voter_id === p.id)
  )

  const submitVote = async () => {
    if (!currentPlayer || !myImpostorVote || !myActionVote) return

    setIsSubmitting(true)

    try {
      await supabase.from('votes').upsert(
        {
          room_id: room.id,
          round: room.round,
          voter_id: currentPlayer.id,
          impostor_vote: myImpostorVote,
          action_vote: myActionVote,
        },
        {
          onConflict: 'room_id,round,voter_id',
        }
      )
      setHasVoted(true)
    } catch (error) {
      console.error('Erro ao votar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const processVotingResults = async () => {
    setIsProcessing(true)
    setRevealResult(true)

    // Aguardar um momento para mostrar resultado
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Contar votos de ação
    const nextRoundVotes = votes.filter((v) => v.action_vote === 'next_round').length
    const endGameVotes = votes.filter((v) => v.action_vote === 'end_game').length

    // Determinar ação com desempate
    // Prioridade: próxima rodada > finalizar (impostor vote já é prioritário)
    let action: 'next_round' | 'end_game'

    if (nextRoundVotes > endGameVotes) {
      action = 'next_round'
    } else if (endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else {
      // Empate: próxima rodada tem prioridade sobre finalizar
      action = 'next_round'
    }

    // Dar ponto a quem acertou o impostor
    const realImpostorId = impostor?.id
    if (realImpostorId) {
      const correctVoters = votes
        .filter((v) => v.impostor_vote === realImpostorId)
        .map((v) => v.voter_id)

      for (const voterId of correctVoters) {
        const player = players.find((p) => p.id === voterId)
        if (player) {
          await supabase
            .from('players')
            .update({ score: player.score + 1 })
            .eq('id', voterId)
        }
      }
    }

    // Executar ação
    if (action === 'next_round') {
      await startNextRound()
    } else {
      await endGame()
    }
  }

  const startNextRound = async () => {
    try {
      // Sortear novo impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id

      // Resetar todos para não-impostor
      await supabase
        .from('players')
        .update({ is_impostor: false })
        .eq('room_id', room.id)

      // Marcar o novo impostor
      await supabase
        .from('players')
        .update({ is_impostor: true })
        .eq('id', impostorId)

      // Atualizar sala com nova rodada e palavra
      await supabase
        .from('rooms')
        .update({
          status: 'playing',
          round: room.round + 1,
          word: getRandomWord(),
        })
        .eq('id', room.id)

      onNextRound()
    } catch (error) {
      console.error('Erro ao iniciar próxima rodada:', error)
    }
  }

  const endGame = async () => {
    try {
      await supabase
        .from('rooms')
        .update({ status: 'ended' })
        .eq('id', room.id)

      onEndGame()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
    }
  }

  const canSubmit = myImpostorVote && myActionVote && !hasVoted

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Rodada {room.round} - Votação</CardTitle>
        <CardDescription>
          A palavra era: <strong className="text-foreground">{room.word}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Se está revelando resultado */}
        {revealResult && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/30 border-2 border-amber-500/50 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">O impostor era:</p>
            <p className="text-3xl font-bold text-amber-400 mb-4">
              🕵️ {impostor?.name}
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Processando votos...</span>
            </div>
          </div>
        )}

        {/* Votação de impostor */}
        {!revealResult && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                🕵️ Quem é o impostor?
              </p>
              <div className="grid gap-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => !hasVoted && setMyImpostorVote(player.id)}
                    disabled={hasVoted}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${myImpostorVote === player.id
                        ? 'border-primary bg-primary/10'
                        : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                      } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span className="flex items-center gap-2">
                      <User className="size-4" />
                      {player.name}
                      {player.id === currentPlayer?.id && (
                        <span className="text-xs text-muted-foreground">(você)</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      {myImpostorVote === player.id && (
                        <Check className="size-4 text-primary" />
                      )}
                      {votes.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {getImpostorVoteCount(player.id)} voto{getImpostorVoteCount(player.id) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Votação de ação */}
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                📋 O que fazer agora?
              </p>
              <div className="grid gap-2">
                <button
                  onClick={() => !hasVoted && setMyActionVote('next_round')}
                  disabled={hasVoted}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${myActionVote === 'next_round'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                    } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2">
                    <Play className="size-4" />
                    Próxima rodada
                  </span>
                  <span className="flex items-center gap-2">
                    {myActionVote === 'next_round' && (
                      <Check className="size-4 text-green-500" />
                    )}
                    {votes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getActionVoteCount('next_round')} voto{getActionVoteCount('next_round') !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => !hasVoted && setMyActionVote('end_game')}
                  disabled={hasVoted}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${myActionVote === 'end_game'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                    } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2">
                    <Flag className="size-4" />
                    Finalizar jogo
                  </span>
                  <span className="flex items-center gap-2">
                    {myActionVote === 'end_game' && (
                      <Check className="size-4 text-red-500" />
                    )}
                    {votes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getActionVoteCount('end_game')} voto{getActionVoteCount('end_game') !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Botão de confirmar */}
            {!hasVoted && (
              <Button
                className="w-full"
                onClick={submitVote}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    Confirmar Voto
                  </>
                )}
              </Button>
            )}

            {hasVoted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <Check className="size-4" />
                  Voto registrado!
                </p>
              </div>
            )}

            {/* Status de votação */}
            <div className="text-center text-sm text-muted-foreground">
              {pendingVoters.length > 0 ? (
                <>
                  <p className="mb-1">
                    Aguardando: {pendingVoters.map((p) => p.name).join(', ')}
                  </p>
                  <p>
                    ({votes.length}/{totalPlayers} votos)
                  </p>
                </>
              ) : (
                <p>Todos votaram! Processando resultados...</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
