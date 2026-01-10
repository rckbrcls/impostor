'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/language-context'

export default function Home() {
  const { t } = useLanguage()

  return (
    <main className="min-h-full p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link passHref href="/create">
            <Button
              className="w-full h-14 text-lg mb-4"
              size="lg"
            >
              {t('home.create_room')}
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-sm">{t('common.or')}</span>
            <Separator className="flex-1" />
          </div>

          <Link passHref href="/join">
            <Button
              className="w-full h-14 text-lg"
              size="lg"
              variant="outline"
            >
              {t('home.join_room')}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
