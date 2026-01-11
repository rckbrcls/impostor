'use client';

import { useLanguage } from '@/components/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-4 text-center text-sm border-t-2 border-black dark:border-white bg-white dark:bg-zinc-950">
      {t('footer.made_by')}{' '}
      <a
        href="https://www.polterware.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold underline hover:text-accent decoration-2 underline-offset-4 transition-colors"
      >
        polterware
      </a>
    </footer>
  );
}
