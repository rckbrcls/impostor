'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-context';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className="absolute top-4 right-4 gap-2 z-50"
    >
      <Languages className="h-4 w-4" />
      {language === 'pt' ? 'EN' : 'PT'}
    </Button>
  );
}
