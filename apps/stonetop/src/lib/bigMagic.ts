import type { CharacterData } from '@/model';
import { moveTakeCount } from './moveTakeCount';

const BIG_MAGIC_ID = 'blessed-big-magic';

export const bigMagicCount = (data: CharacterData | undefined): number => moveTakeCount(data, BIG_MAGIC_ID);
