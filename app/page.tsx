'use client'

import { useState } from 'react'
import { CreateRoomForm } from '@/components/game/create-room-form'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/language-context'

export default function Home() {
  const [mode, setMode] = useState<'create' | 'join' | null>(null)
  const { t } = useLanguage()

  return (
    <main className="min-h-full p-4 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t('home.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('home.subtitle')}
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
              {t('home.create_room')}
            </Button>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-sm">{t('common.or')}</span>
              <Separator className="flex-1" />
            </div>

            <Button
              className="w-full h-14 text-lg"
              size="lg"
              variant="outline"
              onClick={() => setMode('join')}
            >
              {t('home.join_room')}
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
              {t('common.back')}
            </Button>
          </div>
        )}

        {/* Formulários */}
        {mode === 'join' && (
          <div className="space-y-4">
            <JoinRoomForm />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode(null)}
            >
              {t('common.back')}
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          {t('home.footer')}
        </p>
      </div>
    </main>
  )
}
