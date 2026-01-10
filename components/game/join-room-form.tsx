'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRoomByCode, getPlayerByRoomAndClient, addPlayer } from '@/lib/supabase'
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
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Buscar sala pelo código
      const { data: room, error: roomError } = await getRoomByCode(code)

      if (roomError || !room) {
        setError(t('join_room.error_not_found'))
        return
      }

      if (room.status !== 'waiting') {
        setError(t('join_room.error_started'))
        return
      }

      const clientId = getClientId()

      // Verificar se já está na sala
      const { data: existingPlayer } = await getPlayerByRoomAndClient(room.id, clientId)

      if (existingPlayer) {
        // Já está na sala, apenas redireciona
        router.push(`/room/${code.toUpperCase()}`)
        return
      }

      // Entrar na sala
      const { error: playerError } = await addPlayer(room.id, clientId, name.trim())

      if (playerError) throw playerError

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
