'use client'

import { useState } from 'react'
import { CreateRoomForm } from '@/components/game/create-room-form'
import Image from 'next/image'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/language-context'

export default function Home() {
  const [mode, setMode] = useState<'create' | 'join' | null>(null)
  const { t } = useLanguage()

  return (
    <main className="min-h-full p-4 flex items-center justify-center ">
      <div className="w-full max-w-md space-y-8">


        {/* Seleção de modo */}
        {mode === null && (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center justify-center mb-6">
                <Image
                  src="/assets/Group.png"
                  alt={t('home.title')}
                  width={200}
                  height={200}
                  priority
                  className="object-contain"
                />
              </div>
              <p className="text-muted-foreground">
                {t('home.subtitle')}
              </p>
            </div>
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
          </>
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

      </div>
    </main>
  )
}
