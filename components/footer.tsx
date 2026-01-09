'use client';

import { useLanguage } from '@/components/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      {t('footer.made_by')}{' '}
      <a
        href="https://www.erickbarcelos.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground transition-colors"
      >
        erick barcelos
      </a>
    </footer>
  );
}
