'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type Player, type Room } from '@/lib/supabase'
import { getSessionStats, type SessionStats, type PlayerStats } from '@/lib/supabase/session-stats'
import { getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Trophy,
  Home,
  Target,
  VenetianMask,
  HelpCircle,
  Skull,
  Eye,
  Users,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface SessionEndedScreenProps {
  room: Room
  players: Player[]
}

interface RankingCardProps {
  icon: React.ReactNode
  title: string
  description: string
  winner: PlayerStats | null
  statValue: number
  statLabel: string
  bgColor: string
}


function RankingCard({ icon, title, description, winner, statValue, statLabel, bgColor }: RankingCardProps) {
  const { t } = useLanguage()

  if (!winner) {
    return null
  }

  return (
    <div className={`p-4 border-2 border-black dark:border-white shadow-[4px_4px_0_0] rounded-none ${bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-bold text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg">{winner.playerName}</span>
        <span className="text-sm font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded-none">
          {statValue} {statLabel}
        </span>
      </div>
    </div>
  )
}

export function SessionEndedScreen({ room, players }: SessionEndedScreenProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const clientId = getClientId()

  const [stats, setStats] = useState<SessionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true)
      const { data } = await getSessionStats(room.id, players)
      setStats(data)
      setIsLoading(false)
    }
    loadStats()
  }, [room.id, players])

  const goHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto rounded-none">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="w-full max-w-2xl mx-auto rounded-none">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">{t('common.error')}</p>
          <Button onClick={goHome} className="rounded-none">
            <Home className="mr-2 size-4" />
            {t('results.home')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Trophy className="text-yellow-500" />
          {t('session.title')}
        </CardTitle>
        <CardDescription>
          {t('session.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Ranking */}
        <div className="space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Users className="size-4" />
            {t('results.ranking_title')}
          </p>
          {stats.players.map((p, index) => (
            <div
              key={p.playerId}
              className={`flex items-center justify-between p-3 border-2 border-black dark:border-white shadow-[4px_4px_0_0] rounded-none ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                index === 1 ? 'bg-gray-100 dark:bg-gray-800/20' :
                  index === 2 ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-white dark:bg-zinc-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center size-8 rounded-none font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-accent text-muted-foreground'
                  }`}>
                  {index + 1}
                </span>
                <span className="font-bold">
                  {p.playerName} {players.find(pl => pl.id === p.playerId)?.client_id === clientId && t('common.you')}
                </span>
              </div>
              <span className="font-mono font-bold text-lg">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Special Rankings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RankingCard
            icon={<Target className="size-5 text-green-600" />}
            title={t('session.best_detective')}
            description={t('session.best_detective_desc')}
            winner={stats.bestDetective}
            statValue={stats.bestDetective?.correctVotes ?? 0}
            statLabel={t('session.correct_votes_short')}
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <RankingCard
            icon={<VenetianMask className="size-5 text-purple-600" />}
            title={t('session.master_of_disguise')}
            description={t('session.master_of_disguise_desc')}
            winner={stats.masterOfDisguise}
            statValue={stats.masterOfDisguise?.roundsSurvivedAsImpostor ?? 0}
            statLabel={t('session.rounds_short')}
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
          <RankingCard
            icon={<HelpCircle className="size-5 text-blue-600" />}
            title={t('session.most_indecisive')}
            description={t('session.most_indecisive_desc')}
            winner={stats.mostIndecisive}
            statValue={stats.mostIndecisive?.passedRounds ?? 0}
            statLabel={t('session.skips_short')}
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <RankingCard
            icon={<Skull className="size-5 text-red-600" />}
            title={t('session.most_suspicious')}
            description={t('session.most_suspicious_desc')}
            winner={stats.mostSuspicious}
            statValue={stats.mostSuspicious?.timesEliminated ?? 0}
            statLabel={t('session.eliminations_short')}
            bgColor="bg-red-50 dark:bg-red-900/20"
          />
          <RankingCard
            icon={<Eye className="size-5 text-orange-600" />}
            title={t('session.most_accused')}
            description={t('session.most_accused_desc')}
            winner={stats.mostAccused}
            statValue={stats.mostAccused?.votesReceived ?? 0}
            statLabel={t('session.votes_short')}
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
        </div>

        {/* Detailed Stats Table */}
        <div className="border-2 border-black dark:border-white shadow-[4px_4px_0_0] overflow-hidden rounded-none">
          <div className="bg-accent p-3">
            <p className="font-bold text-sm">{t('session.stats_table')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-semibold">{t('session.player')}</th>
                  <th className="text-center p-2 font-semibold" title={t('session.games_played')}>
                    <span className="hidden sm:inline">{t('session.games_played')}</span>
                    <span className="sm:hidden">🎮</span>
                  </th>
                  <th className="text-center p-2 font-semibold" title={t('session.times_impostor')}>
                    <span className="hidden sm:inline">{t('session.times_impostor')}</span>
                    <span className="sm:hidden"><VenetianMask className="size-4 inline" /></span>
                  </th>
                  <th className="text-center p-2 font-semibold" title={t('session.correct_votes')}>
                    <span className="hidden sm:inline">{t('session.correct_votes')}</span>
                    <span className="sm:hidden"><Target className="size-4 inline" /></span>
                  </th>
                  <th className="text-center p-2 font-semibold" title={t('session.passed_rounds')}>
                    <span className="hidden sm:inline">{t('session.passed_rounds')}</span>
                    <span className="sm:hidden"><HelpCircle className="size-4 inline" /></span>
                  </th>
                  <th className="text-center p-2 font-semibold" title={t('session.votes_received')}>
                    <span className="hidden sm:inline">{t('session.votes_received')}</span>
                    <span className="sm:hidden"><Eye className="size-4 inline" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.players.map((p, index) => (
                  <tr key={p.playerId} className={index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-muted/30'}>
                    <td className="p-2 font-medium">{p.playerName}</td>
                    <td className="p-2 text-center">{p.gamesPlayed}</td>
                    <td className="p-2 text-center">{p.timesImpostor}</td>
                    <td className="p-2 text-center">{p.correctVotes}</td>
                    <td className="p-2 text-center">{p.passedRounds}</td>
                    <td className="p-2 text-center">{p.votesReceived}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Home Button */}
        <Button className="w-full rounded-none" onClick={goHome}>
          <Home className="mr-2 size-4" />
          {t('results.home')}
        </Button>
      </CardContent>
    </Card>
  )
}
