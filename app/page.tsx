'use client'

import { useState } from 'react'
import { CreateRoomForm } from '@/components/game/create-room-form'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function Home() {
  const [mode, setMode] = useState<'create' | 'join' | null>(null)

  return (
    <main className="min-h-full p-4 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🕵️ Impostor
          </h1>
          <p className="text-muted-foreground">
            Descubra quem é o impostor entre seus amigos!
          </p>
        </div>

        {/* Seleção de modo */}
        {mode === null && (
          <div className="space-y-4">
            <Button
              className="w-full h-14 text-lg"
              size="lg"
              onClick={() => setMode('create')}
            >
              🎮 Criar Nova Sala
            </Button>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm">ou</span>
              <Separator className="flex-1" />
            </div>

            <Button
              className="w-full h-14 text-lg"
              size="lg"
              variant="outline"
              onClick={() => setMode('join')}
            >
              🚪 Entrar em uma Sala
            </Button>
          </div>
        )}

        {/* Formulários */}
        {mode === 'create' && (
          <div className="space-y-4">
            <CreateRoomForm />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode(null)}
            >
              ← Voltar
            </Button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <JoinRoomForm />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode(null)}
            >
              ← Voltar
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Jogue com 3+ amigos • Cada rodada, alguém é o impostor!
        </p>
      </div>
    </main>
  )
}
