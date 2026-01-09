'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LogIn } from 'lucide-react'

interface JoinRoomFormProps {
  initialCode?: string
}

export function JoinRoomForm({ initialCode = '' }: JoinRoomFormProps) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Buscar sala pelo código
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('code', code.toUpperCase())
        .single()

      if (roomError || !room) {
        setError('Sala não encontrada')
        return
      }

      if (room.status !== 'waiting') {
        setError('Esta sala já está em jogo')
        return
      }

      const clientId = getClientId()

      // Verificar se já está na sala
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', room.id)
        .eq('client_id', clientId)
        .single()

      if (existingPlayer) {
        // Já está na sala, apenas redireciona
        router.push(`/room/${code.toUpperCase()}`)
        return
      }

      // Entrar na sala
      const { error: playerError } = await supabase.from('players').insert({
        room_id: room.id,
        client_id: clientId,
        name: name.trim(),
        is_impostor: false,
        score: 0,
      })

      if (playerError) throw playerError

      router.push(`/room/${code.toUpperCase()}`)
    } catch (err) {
      console.error('Erro ao entrar na sala:', err)
      setError('Erro ao entrar na sala')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Entrar em uma Sala</CardTitle>
        <CardDescription>Digite o código da sala e seu nome</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={joinRoom} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Código da sala (ex: ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-bold uppercase"
            />
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Seu nome"
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
            {isLoading ? 'Entrando...' : 'Entrar na Sala'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
