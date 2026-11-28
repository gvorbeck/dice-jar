import { useTitle } from '@dice-jar/browser';

export const useSiteTitle = (title?: string) =>
  useTitle(title ? `${title} · Glyph Quest` : 'Glyph Quest · Character creator and party tracker');
