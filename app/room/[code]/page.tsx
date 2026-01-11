'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameLoop } from '@/lib/game-engine'
import { Lobby } from '@/components/game/lobby'
import { GameScreen } from '@/components/game/game-screen'
import { VotingScreen } from '@/components/game/voting-screen'
import { VoteResultScreen } from '@/components/game/vote-result-screen'
import { VoteConclusionScreen } from '@/components/game/vote-conclusion-screen'
import { ResultsScreen } from '@/components/game/results-screen'
import { SessionEndedScreen } from '@/components/game/session-ended-screen'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const {
    // State
    viewPhase,
    room,
    game,
    currentRound,
    players,
    gamePlayers,

    // Computed
    currentPlayer,
    currentGamePlayer,
    isHost,
    // isImpostor, // Not used primarily here, passed down via gamePlayers or computed in children

    // Loading
    isLoading,
    // isTransitioning,

    // Actions
    startGame,
    advanceToVoting,
    processVoteResult,
    proceedToConclusion,
    startNextRound,
    endGame,
    playAgain,
    endSession,
    acknowledgeRole,
    refresh,
  } = useGameLoop(code)

  // Redirect if room not found (handled by hook usually? Hook returns room=null if not found/loading)
  // The hook does not auto-redirect on error, so we might want to check for persistent error?
  // For now, if still loading we show skeleton. If done loading and no room, implies error or not found.
  // We can add a simple check if (!isLoading && !room && viewPhase !== 'joining') -> maybe redirect?
  // But viewPhase 'joining' covers the case where room might be valid but we are not joined?
  // Actually viewPhase='joining' means "Room exists, but I am not in it" OR "Room doesn't exist" ?
  // According to useGameLoop docs: joining = No room OR no current player.
  // If room is null, useGameLoop likely returns viewPhase='joining' (default fallback?) or handles it.

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Skeleton className="w-full max-w-md h-80 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]" />
      </div>
    )
  }

  // If no room found after loading, technically we should probably 404 or redirect.
  // But let's assume 'joining' phase handles the "Not Valid" or "Not Joined" case for now.
  // If useGameLoop returns null room but we are not loading, we assume it's valid to show JoinRoomForm (which might fail validation if room doesn't exist).

  return (
    <main className="min-h-full p-4 flex items-center justify-center">
      {viewPhase === 'joining' && <JoinRoomForm initialCode={code} />}

      {viewPhase === 'lobby' && room && (
        <Lobby
          room={room}
          players={players}
          onStart={startGame}
        />
      )}

      {viewPhase === 'reveal' && room && game && currentRound && (
        <GameScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          currentGamePlayer={currentGamePlayer ?? null}
          isHost={isHost}
          onReady={acknowledgeRole}
        />
      )}

      {viewPhase === 'voting' && room && game && currentRound && (
        <VotingScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onProcessVoteResult={processVoteResult}
        />
      )}

      {viewPhase === 'vote_result' && room && game && currentRound && (
        <VoteResultScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onProceedToConclusion={proceedToConclusion}
        />
      )}

      {viewPhase === 'vote_conclusion' && room && game && currentRound && (
        <VoteConclusionScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onStartNextRound={startNextRound}
          onEndGame={endGame}
        />
      )}

      {viewPhase === 'game_over' && room && game && (
        <ResultsScreen
          room={room}
          game={game}
          gamePlayers={gamePlayers}
          players={players}
          onPlayAgain={playAgain}
          onEndSession={endSession}
          isHost={isHost}
        />
      )}

      {viewPhase === 'room_ended' && room && (
        <SessionEndedScreen
          room={room}
          players={players}
        />
      )}
    </main>
  )
}
