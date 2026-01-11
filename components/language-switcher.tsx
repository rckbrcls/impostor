'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/stores/language-store';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className="gap-2"
    >
      <Languages />
      {language === 'pt' ? 'EN' : 'PT'}
    </Button>
  );
}
