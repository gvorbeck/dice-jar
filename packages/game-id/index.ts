/** A uniform integer in [0, n). Draws at or above the largest multiple of n are redrawn, so no result is more likely than another. */
export const randomInt = (n: number) => {
  const limit = 2 ** 32 - (2 ** 32 % n),
    buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0]! >= limit);
  return buf[0]! % n;
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Like `kestrel-lantern-7f3k2a`: two words from the app's list and 6 random characters, ~40 bits. An unlisted link, not a secret (the rules deny listing games). */
export const newGameId = (words: readonly string[]) => {
  const word = () => words[randomInt(words.length)]!.toLowerCase();
  return `${word()}-${word()}-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;
};

/** What an Open box accepts: lowercase letters, digits and single dashes, so an ID is always a safe URL segment. */
export const slugifyGameId = (raw: string, max = 100) =>
  raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, max)
    .replace(/^-+|-+$/g, '');
