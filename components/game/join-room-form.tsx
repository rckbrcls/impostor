'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { getRoomByCode, getPlayerByClient, useAddPlayer } from '@/queries'
import { getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LogIn } from 'lucide-react'
import { useLanguage } from '@/components/language-context'

interface JoinRoomFormProps {
  initialCode?: string
}

export function JoinRoomForm({ initialCode = '' }: JoinRoomFormProps) {
  const router = useRouter()
  const supabase = useSupabaseBrowser()
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const addPlayerMutation = useAddPlayer()

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Fetch room by code using query function
      const { data: room, error: roomError } = await getRoomByCode(supabase, code)

      if (roomError || !room) {
        setError(t('join_room.error_not_found'))
        return
      }

      if (room.status !== 'waiting') {
        setError(t('join_room.error_started'))
        return
      }

      const clientId = getClientId()

      // Check if already in room
      const { data: existingPlayer } = await getPlayerByClient(supabase, room.id, clientId)

      if (existingPlayer) {
        // Already in room, just redirect
        router.push(`/room/${code.toUpperCase()}`)
        return
      }

      // Join the room
      await addPlayerMutation.mutateAsync({
        roomId: room.id,
        clientId,
        name: name.trim(),
      })

      router.push(`/room/${code.toUpperCase()}`)
    } catch (err) {
      console.error('Erro ao entrar na sala:', err)
      setError(t('join_room.error_generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('join_room.title')}</CardTitle>
        <CardDescription>{t('join_room.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={joinRoom} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t('join_room.placeholder_code')}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-bold uppercase"
            />
          </div>

          <div className="space-y-2">
            <Input
              placeholder={t('join_room.placeholder_name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !code.trim() || !name.trim()}
          >
            <LogIn className="mr-2" />
            {isLoading ? t('join_room.button_joining') : t('join_room.button_join')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
