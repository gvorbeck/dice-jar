import { useTitle } from '@dice-jar/browser';

const SITE = 'YOURCODENA.ME';

export const useSiteTitle = (title?: string) => useTitle(title ? `${title} // ${SITE}` : `${SITE} // Agent Intake`);
