'use client'

import { useState } from 'react'
import copy from 'copy-to-clipboard'
import { useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { generateRoomCode, getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Users } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

export function CreateRoomForm() {
  const router = useRouter()
  const supabase = useSupabaseBrowser()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hostName, setHostName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()

  const handleCreateRoom = async () => {
    if (!hostName.trim()) return

    setIsLoading(true)
    try {
      const code = generateRoomCode()
      const hostId = getClientId()

      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({ code, host_id: hostId })
        .select('id')
        .single()

      if (roomError) throw roomError

      // Host also joins as player
      if (roomData?.id) {
        await supabase.from('players').insert({
          room_id: roomData.id,
          client_id: hostId,
          name: hostName.trim(),
        })
      }

      setRoomCode(code)
    } catch (error) {
      console.error('Erro ao criar sala:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/room/${roomCode}`
    copy(link)
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
          <div className="border-2 border-black dark:border-white shadow-[4px_4px_0_0] dark:shadow-white p-4 text-center">
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
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hostName">{t('create_room.label_name')}</Label>
          <Input
            id="hostName"
            placeholder={t('create_room.placeholder_name')}
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateRoom}
          disabled={isLoading || !hostName.trim()}
        >
          {isLoading ? t('create_room.button_creating') : t('create_room.button_create')}
        </Button>
      </CardContent>
    </Card>
  )
}
