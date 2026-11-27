// The home page's cover plate, drawn here so nothing is borrowed: a stair cut through rock, up to a lit gate. Colours come from ornament.css.
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** A step's front edge, sagging in the middle, from the gate (i = 0) to the foot of the plate. */
const stair = (i: number) => {
  const y = 318 + i * 6 + i * i * 0.65,
    half = 26 + i * 15,
    next = 318 + (i + 1) * 6 + (i + 1) * (i + 1) * 0.65,
    h = next - y;
  return { y, half, h };
};

const ROCKS = [
  'M0 0H62L96 38L84 66L130 104L118 140L176 176L166 204L226 230L214 252L268 272L282 300L360 322L322 338L270 368L246 390L180 408L150 438L84 460H0Z',
  'M800 0H742L716 44L730 72L676 108L692 142L628 176L642 206L584 232L596 254L536 274L520 304L440 322L478 340L528 366L556 392L624 408L652 436L718 460H800Z',
];

// Built once, so typing on Home does not redraw it. Its defs ids are global: render it once per page.
const cover = (
  <svg className="cover" viewBox="0 0 800 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cover-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className="cover-sky-top" />
        <stop offset="0.75" className="cover-sky-low" />
      </linearGradient>
      <pattern id="cover-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
        <path d="M0 1H6" className="cover-line" />
      </pattern>
      <pattern id="cover-cut" width="9" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(68)">
        <path d="M0 1H6" className="cover-light-line" />
      </pattern>
      <pattern id="cover-brick" width="22" height="14" patternUnits="userSpaceOnUse">
        <path d="M0 0.5H22M0 7.5H22M5 0V7M16 7V14" className="cover-line" />
      </pattern>
    </defs>

    <rect width="800" height="460" fill="url(#cover-sky)" />
    {/* rays cut into the sky behind the gate */}
    <g className="cover-rays">
      {range(36).map((i) => (
        <path key={i} d="M400 300L396 -260H404Z" transform={`rotate(${i * 10} 400 300)`} />
      ))}
    </g>
    <path className="cover-birds" d="M205 196q8-9 15 0q7-9 15 0M246 176q6-7 11 0q5-7 11 0M590 150q6-7 11 0q5-7 11 0" />

    {/* tower and gatehouse, drawn a little small so the title clears them */}
    <g transform="translate(400 322) scale(0.84) translate(-400 -322)">
      <path
        className="cover-stone"
        d="M498 330V196h-6v-24h13v11h11v-11h14v11h11v-11h14v11h11v-11h13v24h-6v134ZM262 330V232l4-18 9 12 9-12 4 18h26l4-18 9 12 9-12 4 18h26l4-18 9 12 9-12 4 18h26l4-18 9 12 9-12 4 18h26l4-18 9 12 9-12 4 18v98Z"
      />
      <path fill="url(#cover-brick)" d="M498 330V196h66v134ZM262 330V232h236v98Z" />
      <path fill="url(#cover-hatch)" d="M538 196h26v134h-26ZM262 232h48v98h-48Z" />
      <path className="cover-dark" d="M526 232q7-14 14 0v26h-14ZM296 262q5-10 10 0v18h-10ZM462 262q5-10 10 0v18h-10Z" />
    </g>
    <path className="cover-arch" d="M364 322v-36q4-26 36-40q32 14 36 40v36Z" />
    <path className="cover-glow" d="M373 322v-33q3-20 27-32q24 12 27 32v33Z" />
    <path className="cover-dark" d="M397 283a5 5 0 1 1 6 0q8 5 9 38h-24q1-33 9-38ZM413 270h2v52h-2z" />

    {/* the stair */}
    <path className="cover-stair" d="M372 320h56L720 460H80Z" />
    {range(11).map((i) => {
      const { y, half, h } = stair(i);
      return (
        <g key={i}>
          <path
            className="cover-tread"
            d={`M${400 - half} ${y}q${half} ${h * 0.7} ${half * 2} 0l${h} ${h * 0.45}q${-half - h} ${h * 0.7} ${-(half + h) * 2} 0Z`}
          />
          <path className="cover-edge" d={`M${400 - half} ${y}q${half} ${h * 0.7} ${half * 2} 0`} />
        </g>
      );
    })}

    {/* rock walls either side, each cut over with light strokes */}
    {ROCKS.map((d) => (
      <g key={d}>
        <path className="cover-rock" d={d} />
        <path fill="url(#cover-cut)" d={d} />
      </g>
    ))}
  </svg>
);

export const CoverArt = () => cover;
