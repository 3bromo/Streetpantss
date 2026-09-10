// Generates cohesive art-directed SVG lookbook cards for STREET PANTS.
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT = join(process.cwd(), 'public', 'images')
mkdirSync(OUT, { recursive: true })

const W = 900
const H = 1200
const CX = 450

const MONO = `'IBM Plex Mono','Courier New',monospace`

function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Build a trouser silhouette path.
 */
function trouserPath({ waistHalf, hipHalf, legOffset, hemHalf, waistY = 300, hipY = 450, crotchY = 520, hemY = 1050 }) {
  return [
    `M ${CX - waistHalf} ${waistY}`,
    `L ${CX + waistHalf} ${waistY}`,
    `L ${CX + waistHalf + 10} ${waistY + 34}`,
    `L ${CX + hipHalf} ${hipY}`,
    `L ${CX + legOffset + hemHalf} ${hemY}`,
    `L ${CX + legOffset - hemHalf} ${hemY}`,
    `L ${CX + 9} ${crotchY}`,
    `L ${CX - 9} ${crotchY}`,
    `L ${CX - legOffset + hemHalf} ${hemY}`,
    `L ${CX - legOffset - hemHalf} ${hemY}`,
    `L ${CX - hipHalf} ${hipY}`,
    `L ${CX - waistHalf - 10} ${waistY + 34}`,
    'Z',
  ].join(' ')
}

function legXAt({ hipOuter, hemOuter, crotchInner, hemInner, hipY = 450, crotchY = 520, hemY = 1050 }, y) {
  if (y <= hipY) return { outer: hipOuter, inner: CX + 9 }
  const t1 = Math.min(1, Math.max(0, (y - hipY) / (hemY - hipY)))
  const t2 = Math.min(1, Math.max(0, (y - crotchY) / (hemY - crotchY)))
  return { outer: lerp(hipOuter, hemOuter, t1), inner: lerp(crotchInner, hemInner, t2) }
}

function label(caption) {
  return `
  <text x="48" y="${H - 74}" font-family=${JSON.stringify(MONO)} font-size="17" font-weight="500" letter-spacing="6" fill="#071A3D" opacity="0.55">STREET PANTS</text>
  <text x="48" y="${H - 48}" font-family=${JSON.stringify(MONO)} font-size="12" letter-spacing="4" fill="#071A3D" opacity="0.34">${caption}</text>`
}

/**
 * Full product card.
 */
function productCard({
  id,
  fill,
  deep, // darker tone for details
  line, // crease / line color
  bgTop,
  bgBottom,
  caption,
  params,
  cargo = false,
  back = false,
  relaxed = false,
  utility = false,
}) {
  const { waistHalf, hipHalf, legOffset, hemHalf } = params
  const path = trouserPath(params)
  const hipOuter = CX + hipHalf
  const hemOuter = CX + legOffset + hemHalf
  const crotchInner = CX + 9
  const hemInner = CX + legOffset - hemHalf
  const geo = { hipOuter, hemOuter, crotchInner, hemInner }

  const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/>
      <stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#071A3D" stop-opacity="0.12"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.045"/></feComponentTransfer>
    </filter>
  </defs>`

  let details = ''

  // waistband
  details += `
  <rect x="${CX - waistHalf - 10}" y="300" width="${2 * (waistHalf + 10)}" height="36" fill="${fill}" stroke="${deep}" stroke-width="2"/>
  <circle cx="${CX}" cy="318" r="7" fill="#C7CDD9" stroke="#8A93A6" stroke-width="2"/>`

  // belt loops
  for (const lx of [CX - waistHalf + 6, CX - waistHalf / 2, CX - 5, CX + waistHalf / 2 - 5, CX + waistHalf - 16]) {
    details += `<rect x="${lx}" y="296" width="10" height="44" fill="${deep}" opacity="0.85"/>`
  }

  if (!back) {
    // fly + pocket slants
    details += `
    <path d="M ${CX + 7} 340 L ${CX + 7} 448" stroke="${deep}" stroke-width="3" fill="none"/>
    <path d="M ${CX - waistHalf + 16} 366 L ${CX - waistHalf + 62} 456" stroke="${deep}" stroke-width="3" fill="none" opacity="0.9"/>
    <path d="M ${CX + waistHalf - 16} 366 L ${CX + waistHalf - 62} 456" stroke="${deep}" stroke-width="3" fill="none" opacity="0.9"/>`
  } else {
    // back pockets + center seam
    details += `
    <path d="M ${CX} 336 L ${CX} ${520}" stroke="${deep}" stroke-width="3" fill="none"/>
    <g>
      <rect x="${CX - 116}" y="500" width="94" height="108" fill="none" stroke="${deep}" stroke-width="3"/>
      <path d="M ${CX - 116} 538 L ${CX - 22} 538" stroke="${deep}" stroke-width="3"/>
      <circle cx="${CX - 69}" cy="557" r="4.5" fill="${deep}"/>
      <rect x="${CX + 22}" y="500" width="94" height="108" fill="none" stroke="${deep}" stroke-width="3"/>
      <path d="M ${CX + 22} 538 L ${CX + 116} 538" stroke="${deep}" stroke-width="3"/>
      <circle cx="${CX + 69}" cy="557" r="4.5" fill="${deep}"/>
    </g>`
  }

  if (cargo) {
    for (const side of [-1, 1]) {
      const top = legXAt(geo, 620)
      const center = side === 1 ? (top.outer + top.inner) / 2 : 2 * CX - (top.outer + top.inner) / 2
      const px = center - 42
      details += `
      <g>
        <rect x="${px}" y="620" width="84" height="132" fill="${fill}" stroke="${deep}" stroke-width="3"/>
        <path d="M ${px} 656 L ${px + 84} 656" stroke="${deep}" stroke-width="3"/>
        <circle cx="${px + 42}" cy="674" r="4.5" fill="${deep}"/>
      </g>`
    }
  }

  if (utility) {
    // right thigh strap + buckle
    const s = legXAt(geo, 585)
    details += `
    <rect x="${s.inner}" y="578" width="${s.outer - s.inner}" height="18" fill="${deep}"/>
    <rect x="${(s.inner + s.outer) / 2 - 12}" y="572" width="24" height="30" fill="none" stroke="#C7CDD9" stroke-width="3"/>`
    // knee patches
    for (const side of [-1, 1]) {
      const kTop = legXAt(geo, 760)
      const kBot = legXAt(geo, 880)
      const center = (kTop.outer + kTop.inner) / 2
      const cxK = side === 1 ? center : 2 * CX - center
      const wTop = (kTop.outer - kTop.inner) * 0.82
      const wBot = (kBot.outer - kBot.inner) * 0.82
      details += `
      <path d="M ${cxK - wTop / 2} 760 L ${cxK + wTop / 2} 760 L ${cxK + wBot / 2} 880 L ${cxK - wBot / 2} 880 Z" fill="${deep}" opacity="0.55"/>`
    }
  }

  if (relaxed) {
    details += `
    <path d="M ${CX - 9} 338 C ${CX - 16} 368 ${CX - 12} 388 ${CX - 16} 404" stroke="${deep}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M ${CX + 9} 338 C ${CX + 16} 368 ${CX + 12} 388 ${CX + 16} 404" stroke="${deep}" stroke-width="5" fill="none" stroke-linecap="round"/>`
  }

  // creases + hem stitching
  details += `
  <path d="M ${CX + legOffset} 560 L ${CX + legOffset} 1030" stroke="${line}" stroke-width="2.5" fill="none"/>
  <path d="M ${CX - legOffset} 560 L ${CX - legOffset} 1030" stroke="${line}" stroke-width="2.5" fill="none"/>
  <path d="M ${CX + legOffset - hemHalf + 6} 1026 L ${CX + legOffset + hemHalf - 6} 1026" stroke="${line}" stroke-width="2" stroke-dasharray="7 6" fill="none"/>
  <path d="M ${CX - legOffset - hemHalf + 6} 1026 L ${CX - legOffset + hemHalf - 6} 1026" stroke="${line}" stroke-width="2" stroke-dasharray="7 6" fill="none"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${CX}" cy="1078" rx="230" ry="26" fill="#071A3D" opacity="0.14" filter="url(#soft)"/>
  <path d="${path}" fill="${fill}"/>
  <path d="${path}" fill="url(#shade)"/>
  <path d="${path}" fill="none" stroke="${deep}" stroke-width="2.5" opacity="0.8"/>
  ${details}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.6"/>
  ${label(caption)}
</svg>`

  writeFileSync(join(OUT, id), svg)
  console.log('wrote', id)
}

// ---------- configs ----------

const PARAMS = {
  straight: { waistHalf: 116, hipHalf: 148, legOffset: 70, hemHalf: 54 },
  cargo: { waistHalf: 118, hipHalf: 155, legOffset: 74, hemHalf: 62 },
  relaxed: { waistHalf: 115, hipHalf: 158, legOffset: 74, hemHalf: 66 },
  wide: { waistHalf: 112, hipHalf: 165, legOffset: 105, hemHalf: 95 },
}

productCard({
  id: 'col-utility.svg',
  fill: '#0B2555',
  deep: '#051334',
  line: 'rgba(255,255,255,0.12)',
  bgTop: '#DCE2EC',
  bgBottom: '#BFC8D8',
  caption: '01 / UTILITY — DEEP NAVY',
  params: PARAMS.straight,
  utility: true,
})

productCard({
  id: 'prod-relaxed.svg',
  fill: '#D3CCBD',
  deep: '#A79E8B',
  line: 'rgba(0,0,0,0.10)',
  bgTop: '#F4F6FA',
  bgBottom: '#E1E6EF',
  caption: '02 / RELAXED FIT — CREAM',
  params: PARAMS.relaxed,
  relaxed: true,
})

productCard({
  id: 'prod-straight.svg',
  fill: '#101318',
  deep: '#05060a',
  line: 'rgba(255,255,255,0.10)',
  bgTop: '#F4F6FA',
  bgBottom: '#E1E6EF',
  caption: '03 / STRAIGHT — BLACK',
  params: PARAMS.straight,
})

productCard({
  id: 'prod-back.svg',
  fill: '#0B2555',
  deep: '#051334',
  line: 'rgba(255,255,255,0.12)',
  bgTop: '#F4F6FA',
  bgBottom: '#E1E6EF',
  caption: '04 / CARGO — BACK VIEW',
  params: PARAMS.cargo,
  back: true,
})

productCard({
  id: 'prod-widecargo.svg',
  fill: '#0B2555',
  deep: '#051334',
  line: 'rgba(255,255,255,0.12)',
  bgTop: '#E3E7EF',
  bgBottom: '#CBD3E0',
  caption: '06 / WIDE LEG CARGO — NAVY',
  params: PARAMS.wide,
  cargo: true,
})

productCard({
  id: 'prod-essential-relaxed.svg',
  fill: '#0B2555',
  deep: '#051334',
  line: 'rgba(255,255,255,0.12)',
  bgTop: '#F4F6FA',
  bgBottom: '#E1E6EF',
  caption: '07 / RELAXED — DEEP NAVY',
  params: PARAMS.relaxed,
  relaxed: true,
})

// ---------- detail macro ----------
function detailZoom() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="twill" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" fill="#0B2555"/>
      <rect width="7" height="14" fill="#0E2C66"/>
    </pattern>
    <radialGradient id="light" cx="0.3" cy="0.22" r="1.1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.4"/>
    </radialGradient>
    <radialGradient id="metal" cx="0.35" cy="0.3" r="0.9">
      <stop offset="0" stop-color="#E8EBF1"/>
      <stop offset="0.55" stop-color="#AAB3C4"/>
      <stop offset="1" stop-color="#77819A"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#twill)"/>
  <path d="M 292 0 L 292 ${H}" stroke="#C9D2E4" stroke-width="3" stroke-dasharray="10 8" opacity="0.5"/>
  <path d="M 608 0 L 608 ${H}" stroke="#C9D2E4" stroke-width="3" stroke-dasharray="10 8" opacity="0.5"/>
  <rect x="120" y="180" width="46" height="180" fill="#081C45" stroke="#051334" stroke-width="3"/>
  <circle cx="${CX}" cy="760" r="230" fill="#02060f" opacity="0.5" filter="url(#soft)"/>
  <circle cx="${CX}" cy="740" r="200" fill="url(#metal)"/>
  <circle cx="${CX}" cy="740" r="160" fill="none" stroke="#5E6880" stroke-width="5"/>
  <circle cx="${CX}" cy="740" r="34" fill="none" stroke="#5E6880" stroke-width="6"/>
  <text x="${CX}" y="752" text-anchor="middle" font-family=${JSON.stringify(MONO)} font-size="30" letter-spacing="2" fill="#49536B" font-weight="600">SP</text>
  <rect width="${W}" height="${H}" fill="url(#light)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.6"/>
  ${label('05 / DETAIL — HARDWARE')}
</svg>`
  writeFileSync(join(OUT, 'detail-zoom.svg'), svg)
  console.log('wrote detail-zoom.svg')
}
detailZoom()

// ---------- night campaign graphic ----------
function night() {
  const NW = 1600
  const NH = 900
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${NW}" height="${NH}" viewBox="0 0 ${NW} ${NH}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050D1C"/>
      <stop offset="0.55" stop-color="#081A3E"/>
      <stop offset="0.8" stop-color="#0B2555"/>
      <stop offset="1" stop-color="#050D1C"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.24" cy="0.18" r="0.5">
      <stop offset="0" stop-color="#B8C6E0" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#B8C6E0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="trailR" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#DCE4F2" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#DCE4F2" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#DCE4F2" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="trailB" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7E97C8" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7E97C8" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#7E97C8" stop-opacity="0"/>
    </linearGradient>
    <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${NW}" height="${NH}" fill="url(#sky)"/>
  <rect width="${NW}" height="${NH}" fill="url(#glow)"/>
  <g fill="#060F22">
    <rect x="60" y="430" width="150" height="470"/>
    <rect x="240" y="360" width="110" height="540"/>
    <rect x="380" y="470" width="170" height="430"/>
    <rect x="590" y="400" width="120" height="500"/>
    <rect x="1180" y="380" width="130" height="520"/>
    <rect x="1340" y="460" width="180" height="440"/>
  </g>
  <g fill="#12294f" opacity="0.5">
    <rect x="270" y="390" width="8" height="10"/><rect x="290" y="420" width="8" height="10"/>
    <rect x="1210" y="410" width="8" height="10"/><rect x="1240" y="450" width="8" height="10"/>
    <rect x="620" y="430" width="8" height="10"/><rect x="650" y="470" width="8" height="10"/>
  </g>
  <g filter="url(#blur3)">
    <rect x="180" y="560" width="620" height="5" fill="url(#trailR)"/>
    <rect x="520" y="590" width="820" height="4" fill="url(#trailB)"/>
    <rect x="90" y="620" width="520" height="4" fill="url(#trailB)"/>
    <rect x="760" y="648" width="700" height="5" fill="url(#trailR)"/>
  </g>
  <g filter="url(#blur6)">
    <rect x="360" y="676" width="900" height="3" fill="url(#trailB)" opacity="0.7"/>
  </g>
  <g transform="translate(1010, 780)">
    <circle cx="0" cy="-302" r="24" fill="#01040B"/>
    <path d="M -42 -268 C -42 -282 42 -282 42 -268 L 36 -128 L 26 -4 L 12 -4 L 5 -118 L -5 -118 L -12 -4 L -26 -4 L -36 -128 Z" fill="#01040B"/>
  </g>
  <text x="64" y="${NH - 84}" font-family=${JSON.stringify(MONO)} font-size="20" font-weight="500" letter-spacing="8" fill="#F4F6FA" opacity="0.7">STREET PANTS</text>
  <text x="64" y="${NH - 54}" font-family=${JSON.stringify(MONO)} font-size="13" letter-spacing="5" fill="#F4F6FA" opacity="0.4">CITY UNIFORM / 01 — NIGHT</text>
  <rect width="${NW}" height="${NH}" filter="url(#grain)" opacity="0.6"/>
</svg>`
  writeFileSync(join(OUT, 'night.svg'), svg)
  console.log('wrote night.svg')
}
night()

console.log('done')
