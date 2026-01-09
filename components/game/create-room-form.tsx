'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateRoomCode, getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-context'

export function CreateRoomForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  const createRoom = async () => {
    setIsLoading(true)
    try {
      const code = generateRoomCode()
      const hostId = getClientId()

      const { error } = await supabase.from('rooms').insert({
        code,
        host_id: hostId,
        status: 'waiting',
        round: 0,
      })

      if (error) throw error

      // Host também entra como jogador
      await supabase.from('players').insert({
        room_id: (await supabase.from('rooms').select('id').eq('code', code).single()).data?.id,
        client_id: hostId,
        name: 'Host',
        is_impostor: false,
        score: 0,
      })

      setRoomCode(code)
    } catch (error) {
      console.error('Erro ao criar sala:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${roomCode}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const enterRoom = () => {
    router.push(`/room/${roomCode}`)
  }

  if (roomCode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('create_room.success_title')}</CardTitle>
          <CardDescription>{t('create_room.success_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{t('create_room.room_code')}</p>
            <p className="text-4xl font-bold tracking-widest">{roomCode}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyLink}>
              {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
              {copied ? t('common.copied') : t('common.copy_link')}
            </Button>
            <Button className="flex-1" onClick={enterRoom}>
              <Users className="mr-2" />
              {t('create_room.button_enter')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('create_room.title')}</CardTitle>
        <CardDescription>{t('create_room.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" size="lg" onClick={createRoom} disabled={isLoading}>
          {isLoading ? t('create_room.button_creating') : t('create_room.button_create')}
        </Button>
      </CardContent>
    </Card>
  )
}
