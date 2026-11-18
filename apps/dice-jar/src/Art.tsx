// Decorative geometry printed with worn ink, after the logo. Everything here is aria-hidden.
import type { ReactNode } from 'react';

/** The worn-ink filter and halftone pattern every shape uses. Rendered once; shapes refer to them by id. */
export const InkDefs = () => (
  <svg className="defs" aria-hidden="true" focusable="false">
    <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
      {/* Rough edges: the shape is pushed around by low-frequency noise. */}
      <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="7" result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape" />
      {/* Speckle: fine noise, thresholded into holes where the ink didn't take. */}
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="fine" />
      <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 9.4" result="speckle" />
      <feComposite in="shape" in2="speckle" operator="in" result="worn" />
      {/* Mottling: broad dark blotches, like uneven ink coverage. */}
      <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="11" result="blot" />
      <feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.6" result="shade" />
      <feComposite in="shade" in2="worn" operator="atop" />
    </filter>
    <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.9" className="a-midnight" />
    </pattern>
  </svg>
);

/** The hero's backdrop: layered planes and arcs, cropped by the stage. */
export const HeroArt = () => (
  <svg className="art" viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="fade" gradientUnits="userSpaceOnUse" cx="1340" cy="80" r="230">
        <stop offset="0.3" stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id="fade-mask">
        <rect width="1440" height="900" fill="url(#fade)" />
      </mask>
    </defs>
    <g filter="url(#ink)">
      <circle cx="1060" cy="390" r="430" className="a-aubergine" />
      <circle cx="760" cy="720" r="230" className="a-blue" opacity="0.7" />
      <path d="M760 900 A500 500 0 0 1 1260 150" className="a-arc" />
      <circle cx="1340" cy="80" r="230" className="a-magenta" />
      <polygon points="0,0 520,0 180,330" className="a-purple" opacity="0.55" />
      <circle cx="640" cy="120" r="46" className="a-ring" />
    </g>
    {/* Halftone over the magenta disc, fading out from its centre. */}
    <circle cx="1340" cy="80" r="230" fill="url(#dots)" opacity="0.55" mask="url(#fade-mask)" />
  </svg>
);

/** One loose shape, positioned by its class. Its viewBox is in CSS pixels, so the ink filter wears it at the same scale as the hero. */
const Shape = ({ className, w, h, children }: { className: string; w: number; h: number; children: ReactNode }) => (
  <svg className={`shape ${className}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
    <g filter="url(#ink)">{children}</g>
  </svg>
);

/** Shapes drifting down the page behind the content, mostly cropped by its edges. */
export const PageArt = () => (
  <>
    <Shape className="s-violet" w={440} h={440}>
      <circle cx="220" cy="220" r="190" className="a-violet" />
    </Shape>
    <Shape className="s-arc" w={520} h={520}>
      <path d="M40 330 A230 230 0 0 1 470 200" className="a-arc" />
    </Shape>
    <Shape className="s-facet" w={240} h={200}>
      <polygon points="20,180 120,20 220,150" className="a-magenta" />
      <polygon points="120,20 220,150 135,115" className="a-raspberry" />
    </Shape>
    <Shape className="s-ring" w={150} h={150}>
      <circle cx="75" cy="75" r="50" className="a-ring" />
    </Shape>
    <Shape className="s-plane" w={720} h={480}>
      <ellipse cx="360" cy="240" rx="320" ry="200" className="a-aubergine" />
    </Shape>
    <Shape className="s-navy" w={600} h={600}>
      <circle cx="300" cy="300" r="260" className="a-blue" />
    </Shape>
    <Shape className="s-shard" w={200} h={180}>
      <polygon points="20,160 95,20 180,120" className="a-orchid" />
      <polygon points="95,20 180,120 110,95" className="a-purple" />
    </Shape>
  </>
);
