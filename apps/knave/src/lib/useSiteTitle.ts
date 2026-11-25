import { useTitle } from '@dice-jar/browser';

export const useSiteTitle = (title?: string) => useTitle(title ? `${title} · Knave` : 'Knave · Character creator and party tracker');
