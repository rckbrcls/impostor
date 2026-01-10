'use client';

import { useLanguage } from '@/components/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-4 text-center text-sm border-t-2 border-black dark:border-white bg-white dark:bg-zinc-950">
      {t('footer.made_by')}{' '}
      <a
        href="https://www.erickbarcelos.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold hover:underline decoration-2 underline-offset-4"
      >
        erick barcelos
      </a>
    </footer>
  );
}
