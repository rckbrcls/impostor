'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'
import { ModeToggle } from '@/components/mode-toggle'
import { Home, Menu } from 'lucide-react'
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
            <div className="flex flex-col gap-4 mt-4">
              <Button
                variant="ghost"
                asChild
                className="justify-start"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/">
                  <Home className="mr-2 size-4" />
                  Impostor
                </Link>
              </Button>



            </div>
            <SheetFooter className="flex-row justify-between sm:justify-end gap-2">
              <LanguageSwitcher />
              <ModeToggle />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop View: Full Header */}
      <header className="hidden sm:flex items-center justify-between border-b-2 border-black dark:border-white bg-white p-4 dark:bg-zinc-900 shadow-sm relative z-40">
        <Button
          variant="ghost"
          asChild
          className="gap-2 hover:bg-transparent hover:underline hover:decoration-2 hover:underline-offset-4"
        >
          <Link href="/">
            <Home className="size-5" />
            <span className="font-bold text-lg">Impostor</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </header>
    </>
  )
}
