'use client';

import { openCookieSettings } from '@/lib/consent';

export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className ?? 'link-button'} onClick={openCookieSettings}>
      Configurar cookies
    </button>
  );
}
