'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/stores/language-store'
import { Gamepad2, DoorOpen } from 'lucide-react'
import { MeshGradient } from '@mesh-gradient/react'
import { type MeshGradientOptions } from '@mesh-gradient/core'
import { useIsMobile } from '@/hooks/use-mobile'

export default function Home() {
  const { t } = useLanguage()
  const isMobile = useIsMobile()

  const options: MeshGradientOptions = {
    colors: ['#F335AD', '#967FE6', '#23B684', '#0F595E']
  }

  return (
    <>
      <MeshGradient options={options} className="w-full h-screen fixed -z-10" />
      <main className="min-h-full p-4 flex items-center justify-center">
        <div className="w-full sm:flex flex-col justify-between items-center max-w-3xl space-y-8">


          {/* Action Buttons */}
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/assets/impostor.png"
                alt={t('home.title')}
                width={isMobile ? 200 : 300}
                height={isMobile ? 200 : 300}
                priority
                className="object-contain"
              />
            </div>
            <p className="font-semibold text-white antialiased">
              {t('home.subtitle')}
            </p>
            <Link passHref href="/create">
              <Button
                className="w-full h-14 text-lg mb-4"
                size="lg"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                {t('home.create_room')}
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-white text-sm">{t('common.or')}</span>
              <Separator className="flex-1" />
            </div>

            <Link passHref href="/join">
              <Button
                className="w-full h-14 text-lg"
                size="lg"
                variant="outline"
              >
                <DoorOpen className="mr-2 h-5 w-5" />
                {t('home.join_room')}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
