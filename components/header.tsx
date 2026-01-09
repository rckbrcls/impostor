'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'
import { Home } from 'lucide-react'

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="flex items-center justify-between border-b-2 border-black dark:border-white bg-white p-4 dark:bg-zinc-900 shadow-sm">
      <Button variant="ghost" asChild className="gap-2 hover:bg-transparent hover:underline hover:decoration-2 hover:underline-offset-4">
        <Link href="/">
          <Home className="size-5" />
          <span className="font-bold text-lg hidden sm:inline">Impostor</span>
        </Link>
      </Button>

      <LanguageSwitcher />
    </header>
  )
}
