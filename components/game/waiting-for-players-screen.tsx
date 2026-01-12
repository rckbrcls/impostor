'use client'

import { useEffect } from 'react'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type GamePlayerWithPlayer } from '@/lib/supabase'
import { useLanguage } from '@/stores/language-store'

interface WaitingForPlayersScreenProps {
  gamePlayers: GamePlayerWithPlayer[]
  isHost: boolean
  onAdvanceToVoting?: () => void
}

export function WaitingForPlayersScreen({
  gamePlayers,
  isHost,
  onAdvanceToVoting
}: WaitingForPlayersScreenProps) {
  const { t } = useLanguage()

  // Calculate ready count
  const readyCount = gamePlayers.filter(gp => gp.role_acknowledged).length
  const totalCount = gamePlayers.length

  // Check if all active players are ready (Host only)
  useEffect(() => {
    if (!isHost || !gamePlayers.length) return

    // Logic from GameScreen: simple check if everyone has acknowledged
    const allReady = gamePlayers.every(gp => gp.role_acknowledged)

    if (allReady) {
      // Small delay for UX so host sees the "Waiting" state change momentarily
      const timer = setTimeout(() => {
        onAdvanceToVoting && onAdvanceToVoting()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isHost, gamePlayers, onAdvanceToVoting])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {t('game.waiting_title') || 'Waiting for Players'}
        </CardTitle>
        <CardDescription>
          {t('game.waiting_desc') || 'The voting will start once everyone is ready.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="flex justify-center">
          <AnimatedCircularProgressBar
            max={totalCount}
            min={0}
            value={readyCount}
            gaugePrimaryColor="var(--primary)"
            gaugeSecondaryColor="var(--muted)"
          >
            <span className="text-xl font-bold">
              {totalCount}/{readyCount}
            </span>
          </AnimatedCircularProgressBar>
        </div>
        <p className="text-lg font-medium">
          {readyCount} / {totalCount} {t('game.players_ready') || 'players ready'}
        </p>
        {isHost && readyCount < totalCount && (
          <p className="text-sm text-muted-foreground">
            {t('game.host_waiting_hint') || 'As host, the game will advance automatically when everyone is ready.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
