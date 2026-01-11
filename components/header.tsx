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
  /* const { t } = useLanguage() */
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile View: Floating Button Only */}
      <div className="sm:hidden absolute top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              <Link passHref href="/">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <Home className="mr-2 size-4" />
                  Home
                </Button>
              </Link>
              <Link passHref href="/create">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <Joystick className="mr-2 size-4" />
                  Create New Room
                </Button>
              </Link>
              <Link passHref href="/join">
                <Button
                  variant="outline"
                  className="justify-start w-full"
                  onClick={() => setIsOpen(false)}
                >

                  <DoorClosed className="mr-2 size-4" />
                  Join a Room
                </Button>
              </Link>
            </div>
            <SheetFooter className="flex-row justify-between sm:justify-end gap-2">
              <LanguageSwitcher />
              <ModeToggle />
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
              <span >Home</span>
            </Button>

          </Link>
          <Link passHref href="/create">
            <Button
              variant="outline"
              className="gap-2"
            >

              <Joystick className="size-5" />
              <span >Create New Room</span>
            </Button>
          </Link>
          <Link passHref href="/join">
            <Button
              variant="outline"
              className="gap-2"
            >

              <DoorClosed className="size-5" />
              <span >
                Join a Room
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
