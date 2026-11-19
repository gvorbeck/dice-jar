import { describe, expect, it } from 'vitest';
import { IMPROVEMENTS } from './steadingImprovementsData';

const itemsOf = (id: string) =>
  IMPROVEMENTS.find((i) => i.id === id)!.requirements.flatMap((r) => (r.type === 'checkboxes' ? r.items.map((x) => x.label) : []));

// Stonetop (Book 1), p. 157: "Requires 2 of the following": a method of making water flow uphill, a series of
// aqueducts, and a reservoir. Two items under "2 of" would mean both are required.
describe('Harnessing the Stream', () => {
  it('lists the three requirements, of which 2 are needed', () => {
    expect(itemsOf('harnessing-the-stream')).toEqual([
      'Some method of making water flow uphill',
      "A series of aqueducts, from the Stream's source back to Stonetop",
      'A reservoir to contain the diverted water',
    ]);
  });
});

describe('"N of the following" requirements', () => {
  it('always offer more than N items, or the choice is meaningless', () => {
    for (const imp of IMPROVEMENTS) {
      const reqs = imp.requirements;
      reqs.forEach((r, i) => {
        const n = r.type === 'text' ? /\b(\d) of the following/.exec(r.content)?.[1] : undefined;
        const next = reqs[i + 1];
        if (n && next?.type === 'checkboxes') expect(next.items.length, imp.title).toBeGreaterThan(Number(n));
      });
    }
  });
});
