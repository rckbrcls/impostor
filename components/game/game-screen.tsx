'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Player, type Room } from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'

interface GameScreenProps {
  room: Room
  players: Player[]
  currentPlayer: Player | null
}

export function GameScreen({ room, players, currentPlayer }: GameScreenProps) {
  const clientId = getClientId()
  const isImpostor = currentPlayer?.is_impostor ?? false

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          Rodada {room.round}
        </CardTitle>
        <CardDescription>
          {players.length} jogadores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resultado do jogador */}
        <div className={`rounded-xl p-8 text-center ${isImpostor
            ? 'bg-gradient-to-br from-red-500/20 to-red-600/30 border-2 border-red-500/50'
            : 'bg-gradient-to-br from-green-500/20 to-emerald-600/30 border-2 border-green-500/50'
          }`}>
          {isImpostor ? (
            <>
              <p className="text-6xl mb-4">🕵️</p>
              <p className="text-3xl font-bold text-red-400">
                VOCÊ É O IMPOSTOR!
              </p>
              <p className="text-muted-foreground mt-2">
                Descubra a palavra sem ser pego!
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">A palavra é:</p>
              <p className="text-4xl font-bold text-green-400 uppercase">
                {room.word}
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                Descreva sem falar a palavra!
              </p>
            </>
          )}
        </div>

        {/* Lista de jogadores */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">
            Jogadores na rodada
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((player) => (
              <span
                key={player.id}
                className={`px-3 py-1 rounded-full text-sm ${player.client_id === clientId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                  }`}
              >
                {player.name}
              </span>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Aguarde o host encerrar a rodada...
        </p>
      </CardContent>
    </Card>
  )
}
