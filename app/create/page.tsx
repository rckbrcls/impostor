'use client'

import { CreateRoomForm } from '@/components/game/create-room-form'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/stores/language-store'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreatePage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-full p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4">
          <CreateRoomForm />
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
