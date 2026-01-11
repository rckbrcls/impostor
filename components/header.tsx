'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/stores/language-store'
import { ModeToggle } from '@/components/mode-toggle'
import { DoorClosed, Home, Joystick, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

export function Header() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile View: Floating Button Only */}
      <div className="sm:hidden fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">{t('header.toggle_menu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
              </SheetTitle>
              <div className="flex gap-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              <Link passHref href="/">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <Home className="mr-2 size-4" />
                  {t('header.home')}
                </Button>
              </Link>
              <Link passHref href="/create">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <Joystick className="mr-2 size-4" />
                  {t('home.create_room')}
                </Button>
              </Link>
              <Link passHref href="/join">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <DoorClosed className="mr-2 size-4" />
                  {t('home.join_room')}
                </Button>
              </Link>
            </div>
            <SheetFooter>
              <SheetTitle>
                <span className="font-medium">
                  {t('footer.made_by')}{' '}
                  <a
                    href="https://www.polterware.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline hover:text-accent decoration-2 underline-offset-4 transition-colors"
                  >
                    polterware
                  </a>
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t('header.nav_desc')}
              </SheetDescription>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View: Full Header */}
      <header className="hidden sm:flex items-center justify-between border-b-2 border-black dark:border-white bg-white p-4 dark:bg-zinc-950 shadow-sm relative z-40">
        <div className="flex gap-2">
          <Link passHref href="/">
            <Button
              variant="outline"
              className="gap-2"
            >

              <Home className="size-5" />
              <span >{t('header.home')}</span>
            </Button>

          </Link>
          <Link passHref href="/create">
            <Button
              variant="outline"
              className="gap-2"
            >

              <Joystick className="size-5" />
              <span >{t('home.create_room')}</span>
            </Button>
          </Link>
          <Link passHref href="/join">
            <Button
              variant="outline"
              className="gap-2"
            >

              <DoorClosed className="size-5" />
              <span >
                {t('home.join_room')}
              </span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </header>
    </>
  )
}
