import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'src', 'assets');
const DM_SANS = path.join(ASSETS, 'fonts', 'dm-sans-latin.woff2');
const JETBRAINS_MONO = path.join(ASSETS, 'fonts', 'jetbrains-mono-latin.woff2');
const BRAND_LOCKUP = path.join(ASSETS, 'brand-lockup-full.svg');
const BRAND_MARK = path.join(ASSETS, 'brand-mark-white.svg');

function svgDataUri(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
}

function binaryDataUri(filePath, mimeType) {
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeCard({ fileName, svg }) {
  const svgPath = path.join(ASSETS, `${fileName}.svg`);
  const pngPath = path.join(ASSETS, `${fileName}.png`);
  fs.writeFileSync(svgPath, svg, 'utf8');

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: true,
      fontFiles: [DM_SANS, JETBRAINS_MONO],
    },
  });

  fs.writeFileSync(pngPath, resvg.render().asPng());
  console.log(`  built: assets/${fileName}.svg`);
  console.log(`  built: assets/${fileName}.png`);
}

function renderHomeCard() {
  const lockupHref = svgDataUri(BRAND_LOCKUP);
  const productScreenHref = binaryDataUri(path.join(ASSETS, 'product-exercise-bench.jpg'), 'image/jpeg');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Maatriks homepage social card">
  <defs>
    <linearGradient id="bgWash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#121015"/>
      <stop offset="45%" stop-color="#090a0d"/>
      <stop offset="100%" stop-color="#050506"/>
    </linearGradient>
    <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff8a1f"/>
      <stop offset="100%" stop-color="#ffb347"/>
    </linearGradient>
    <linearGradient id="screenBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#181820"/>
      <stop offset="55%" stop-color="#0c0d11"/>
      <stop offset="100%" stop-color="#07080a"/>
    </linearGradient>
    <linearGradient id="screenGlow" x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="rgba(255,179,71,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0.02)"/>
    </linearGradient>
    <radialGradient id="heroGlow" cx="82%" cy="28%" r="44%">
      <stop offset="0%" stop-color="rgba(255,179,71,0.26)"/>
      <stop offset="56%" stop-color="rgba(255,138,31,0.10)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0)"/>
    </radialGradient>
    <radialGradient id="phoneGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,138,31,0.48)"/>
      <stop offset="64%" stop-color="rgba(255,138,31,0.14)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0)"/>
    </radialGradient>
    <pattern id="gridDots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#24242c"/>
    </pattern>
    <clipPath id="homePhoneScreen">
      <rect x="16" y="16" width="226" height="480" rx="34"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bgWash)"/>
  <rect width="1200" height="630" fill="url(#gridDots)" opacity="0.42"/>
  <rect width="1200" height="630" fill="url(#heroGlow)"/>
  <rect x="0" y="0" width="1200" height="10" fill="url(#edgeGlow)"/>

  <path d="M782 0H1200V630H676C696 534 732 468 790 412C840 363 896 332 950 282C1014 223 1053 148 1076 0Z" fill="rgba(255,255,255,0.02)"/>
  <path d="M748 28C888 -10 1050 82 1138 244C1182 324 1202 411 1200 508L1089 561C1051 482 1000 418 938 368C870 313 790 274 734 210C697 168 676 118 670 60Z" fill="rgba(255,138,31,0.08)"/>

  <image href="${lockupHref}" x="84" y="58" width="284" height="55"/>

  <text x="84" y="156" fill="#ffb347" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="600" letter-spacing="4.8">YOUR WORKOUT, CLEARLY PLANNED</text>

  <text x="84" y="244" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="76" font-weight="800" letter-spacing="-3.6">
    <tspan x="84" dy="0">Just show up.</tspan>
    <tspan x="84" dy="84">We&apos;ll handle</tspan>
    <tspan x="84" dy="84">the plan.</tspan>
  </text>

  <text x="84" y="496" fill="#c7c7d2" font-family="'DM Sans', sans-serif" font-size="28" font-weight="500" letter-spacing="-0.4">Guidance, logging, and optional Auto-progression.</text>

  <g transform="translate(84 536)">
    <rect x="0" y="0" width="96" height="38" rx="19" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
    <rect x="108" y="0" width="80" height="38" rx="19" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
    <rect x="200" y="0" width="96" height="38" rx="19" fill="rgba(255,138,31,0.14)" stroke="rgba(255,179,71,0.22)"/>
    <text x="48" y="24" fill="#f2f2f7" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="500" text-anchor="middle" letter-spacing="1.8">PLAN</text>
    <text x="148" y="24" fill="#f2f2f7" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="500" text-anchor="middle" letter-spacing="1.8">LOG</text>
    <text x="248" y="24" fill="#ffb347" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="1.8">NEXT</text>
  </g>

  <g transform="translate(808 70)">
    <circle cx="180" cy="214" r="188" fill="url(#phoneGlow)"/>
    <rect x="18" y="30" width="258" height="512" rx="46" fill="rgba(0,0,0,0.34)"/>

    <g transform="rotate(6 147 256)">
      <rect x="0" y="0" width="258" height="512" rx="46" fill="#050507" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>
      <rect x="16" y="16" width="226" height="480" rx="34" fill="url(#screenBg)"/>
      <rect x="16" y="16" width="226" height="480" rx="34" fill="url(#screenGlow)"/>
      <rect x="87" y="16" width="84" height="22" rx="0 0 16 16" fill="#050507"/>

      <text x="34" y="54" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700">14:00</text>
      <text x="184" y="54" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.2">LTE</text>
      <rect x="213" y="44" width="16" height="8" rx="4" fill="#f2f2f7"/>

      <text x="34" y="96" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" letter-spacing="1.8">TODAY</text>
      <text x="34" y="138" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="33" font-weight="700" letter-spacing="-1.6">Full Body C</text>
      <text x="34" y="164" fill="#b9b9c3" font-family="'DM Sans', sans-serif" font-size="15" font-weight="500">5 exercises ready</text>

      <g transform="translate(30 198)">
        <text x="0" y="0" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.6">THIS WEEK</text>
        <text x="146" y="0" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.2">0 / 4</text>
        <rect x="0" y="18" width="178" height="1" fill="rgba(255,255,255,0.10)"/>
        <g transform="translate(0 30)">
          <circle cx="9" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
          <circle cx="35" cy="0" r="5.5" fill="#ff8a1f" opacity="0.92"/>
          <circle cx="61" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
          <circle cx="87" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
          <circle cx="113" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
          <circle cx="139" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
          <circle cx="165" cy="0" r="5.5" fill="#ffffff14" stroke="rgba(255,255,255,0.18)"/>
        </g>
        <text x="2" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">MON</text>
        <text x="28" y="50" fill="#f2f2f7" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">TUE</text>
        <text x="54" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">WED</text>
        <text x="80" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">THU</text>
        <text x="106" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">FRI</text>
        <text x="132" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">SAT</text>
        <text x="158" y="50" fill="#6b6b76" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="600" letter-spacing="1.1">SUN</text>
      </g>

      <g transform="translate(30 286)">
        <rect width="182" height="72" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
        <text x="18" y="26" fill="#ffb347" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.6">AUTO-PROGRESSION</text>
        <text x="18" y="49" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="17" font-weight="700">Optional next</text>
        <text x="18" y="69" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="17" font-weight="700">target changes</text>
        <text x="156" y="44" fill="#ffb347" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700">→</text>
      </g>

      <g transform="translate(30 378)">
        <text x="0" y="0" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="600" letter-spacing="1.5">UP NEXT</text>
        <g transform="translate(0 18)">
          <rect width="182" height="40" rx="12" fill="rgba(255,255,255,0.04)"/>
          <text x="14" y="24" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="14" font-weight="600">Front squat</text>
          <text x="124" y="24" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.2">3 x 5</text>
        </g>
        <g transform="translate(0 64)">
          <rect width="182" height="40" rx="12" fill="rgba(255,255,255,0.04)"/>
          <text x="14" y="24" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="14" font-weight="600">RDL</text>
          <text x="138" y="24" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600" letter-spacing="1.2">3 x 8</text>
        </g>
      </g>

      <g transform="translate(30 440)">
        <rect width="182" height="42" rx="14" fill="url(#edgeGlow)"/>
        <text x="20" y="26" fill="#120b05" font-family="'DM Sans', sans-serif" font-size="15" font-weight="800">Start session</text>
        <text x="150" y="26" fill="#120b05" font-family="'DM Sans', sans-serif" font-size="18" font-weight="800">→</text>
      </g>

      <image href="${productScreenHref}" x="16" y="16" width="226" height="480" preserveAspectRatio="xMidYMin slice" clip-path="url(#homePhoneScreen)"/>
      <rect x="87" y="16" width="84" height="22" rx="0 0 16 16" fill="#050507"/>
    </g>
  </g>

</svg>`;

  writeCard({
    fileName: 'social-home',
    svg,
  });
}

function renderCard({
  fileName,
  label,
  titleLines,
  description,
  footer,
  accentTitle,
}) {
  const lockupHref = svgDataUri(BRAND_LOCKUP);
  const markHref = svgDataUri(BRAND_MARK);
  const title = titleLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 88}">${escapeXml(line)}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(label)} social card">
  <defs>
    <linearGradient id="bgWash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171117"/>
      <stop offset="42%" stop-color="#0c0c10"/>
      <stop offset="100%" stop-color="#08080c"/>
    </linearGradient>
    <radialGradient id="amberGlow" cx="76%" cy="38%" r="42%">
      <stop offset="0%" stop-color="rgba(255,138,31,0.30)"/>
      <stop offset="55%" stop-color="rgba(255,138,31,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0)"/>
    </radialGradient>
    <radialGradient id="gridDot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2d2d36"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#2a2a33"/>
    </pattern>
    <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff8a1f"/>
      <stop offset="100%" stop-color="#ffb347"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgWash)"/>
  <rect width="1200" height="630" fill="url(#dotGrid)" opacity="0.5"/>
  <rect width="1200" height="630" fill="url(#amberGlow)"/>
  <rect x="0" y="0" width="1200" height="10" fill="url(#edgeGlow)" opacity="0.92"/>

  <image href="${lockupHref}" x="96" y="72" width="318" height="62"/>

  <text x="96" y="176" fill="#ff8a1f" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="600" letter-spacing="5.2">${escapeXml(label)}</text>

  <text x="96" y="258" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="74" font-weight="800" letter-spacing="-3.6">${title}</text>

  <text x="96" y="486" fill="#b9b9c3" font-family="'DM Sans', sans-serif" font-size="30" font-weight="500" letter-spacing="-0.4">${escapeXml(description)}</text>

  <g opacity="0.16">
    <circle cx="960" cy="260" r="178" fill="#ff8a1f"/>
    <circle cx="960" cy="260" r="122" fill="#ffb347"/>
  </g>
  <image href="${markHref}" x="818" y="118" width="284" height="284" opacity="0.92"/>

  <g transform="translate(744 408)">
    <rect width="340" height="134" rx="22" fill="rgba(17,17,24,0.82)" stroke="rgba(255,255,255,0.08)"/>
    <text x="30" y="42" fill="#ffb347" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="600" letter-spacing="3.2">MAATRIKS.AI</text>
    <text x="30" y="84" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="34" font-weight="700" letter-spacing="-1.2">${escapeXml(accentTitle)}</text>
    <text x="30" y="112" fill="#8e8e9a" font-family="'DM Sans', sans-serif" font-size="18" font-weight="500">${escapeXml(footer)}</text>
  </g>

  <rect x="96" y="548" width="196" height="1.5" fill="url(#edgeGlow)" opacity="0.9"/>
  <text x="96" y="586" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="500" letter-spacing="2.4">${escapeXml(footer)}</text>
</svg>`;

  writeCard({ fileName, svg });
}

function renderFeatureCard({
  fileName,
  label,
  titleLines,
  description,
  imageFile = null,
  imageMimeType = 'image/jpeg',
  landscape = false,
  rules = [],
}) {
  const lockupHref = svgDataUri(BRAND_LOCKUP);
  const imageHref = imageFile
    ? binaryDataUri(path.join(ASSETS, imageFile), imageMimeType)
    : null;
  const title = titleLines
    .map((line, index) => `<tspan x="76" dy="${index === 0 ? 0 : 78}">${escapeXml(line)}</tspan>`)
    .join('');
  const visual = imageHref
    ? landscape
      ? `<rect x="736" y="180" width="400" height="250" rx="24" fill="#0c0c10" stroke="rgba(255,138,31,0.34)" stroke-width="2"/>
  <image href="${imageHref}" x="750" y="194" width="372" height="222" preserveAspectRatio="xMidYMid slice" clip-path="url(#landscapeClip)"/>`
      : `<rect x="842" y="76" width="250" height="494" rx="42" fill="#050507" stroke="rgba(255,138,31,0.34)" stroke-width="2"/>
  <image href="${imageHref}" x="856" y="90" width="222" height="466" preserveAspectRatio="xMidYMin slice" clip-path="url(#phoneClip)"/>`
    : `<g transform="translate(744 138)">
  <rect width="384" height="354" rx="24" fill="rgba(10,10,15,0.94)" stroke="rgba(255,138,31,0.34)" stroke-width="2"/>
  <text x="28" y="48" fill="#ff8a1f" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="600" letter-spacing="2.8">CLEAR RULES · VISIBLE CHANGES</text>
  ${rules.map((rule, index) => `<g transform="translate(28 ${88 + index * 82})">
    <text x="0" y="20" fill="#ff8a1f" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="700">0${index + 1}</text>
    <text x="52" y="20" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="23" font-weight="700">${escapeXml(rule)}</text>
    <line x1="0" y1="50" x2="328" y2="50" stroke="rgba(255,255,255,0.09)"/>
  </g>`).join('')}
</g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(label)} social card">
  <defs>
    <linearGradient id="bgWash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171117"/>
      <stop offset="48%" stop-color="#0b0c10"/>
      <stop offset="100%" stop-color="#07080b"/>
    </linearGradient>
    <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff8a1f"/>
      <stop offset="100%" stop-color="#ffb347"/>
    </linearGradient>
    <radialGradient id="amberGlow" cx="78%" cy="35%" r="46%">
      <stop offset="0%" stop-color="rgba(255,138,31,0.20)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0)"/>
    </radialGradient>
    <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#292932"/>
    </pattern>
    <clipPath id="phoneClip"><rect x="856" y="90" width="222" height="466" rx="30"/></clipPath>
    <clipPath id="landscapeClip"><rect x="750" y="194" width="372" height="222" rx="14"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#bgWash)"/>
  <rect width="1200" height="630" fill="url(#dotGrid)" opacity="0.45"/>
  <rect width="1200" height="630" fill="url(#amberGlow)"/>
  <rect width="1200" height="10" fill="url(#edgeGlow)"/>
  <image href="${lockupHref}" x="76" y="58" width="268" height="52"/>
  <text x="76" y="164" fill="#ff8a1f" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" letter-spacing="4.4">${escapeXml(label)}</text>
  <text x="76" y="248" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="68" font-weight="800" letter-spacing="-3.2">${title}</text>
  <text x="76" y="505" fill="#b9b9c3" font-family="'DM Sans', sans-serif" font-size="26" font-weight="500">${escapeXml(description)}</text>
  <text x="76" y="570" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="600" letter-spacing="2.2">MAATRIKS.AI</text>
  ${visual}
</svg>`;

  writeCard({ fileName, svg });
}

renderHomeCard();

renderCard({
  fileName: 'social-blog',
  label: 'JOURNAL',
  titleLines: [
    'Train with',
    'a clearer plan.',
  ],
  description: 'Practical training guides and current product notes.',
  footer: 'maatriks.ai/blog',
  accentTitle: 'Guides and product notes',
});

renderFeatureCard({
  fileName: 'social-workout-planner-app',
  label: 'WORKOUT PLANNER APP',
  titleLines: ['Your workout', 'is ready.'],
  description: 'Start with a structured program. Keep control.',
  imageFile: 'product-onboarding.jpg',
});

renderFeatureCard({
  fileName: 'social-gym-workout-tracker',
  label: 'GYM WORKOUT TRACKER',
  titleLines: ['Track the work,', 'not the admin.'],
  description: 'Weights, sets, reps, warm-ups, and time.',
  imageFile: 'product-workout-active.jpg',
});

renderFeatureCard({
  fileName: 'social-auto-progression',
  label: 'AUTO-PROGRESSION',
  titleLines: ['Know what to', 'aim for next.'],
  description: 'Optional, deterministic, and visible.',
  rules: ['Completed work', 'Rep-range rules', 'Next target'],
});

renderFeatureCard({
  fileName: 'social-workout-timers',
  label: 'WORKOUT TIMERS',
  titleLines: ['Keep the clock', 'in the workout.'],
  description: 'Timed exercises and rest, saved in place.',
  imageFile: 'product-timed-exercise-active.jpg',
});

renderFeatureCard({
  fileName: 'social-beginner-workout-app',
  label: 'BEGINNER WORKOUT APP',
  titleLines: ['Know what to do', 'at the gym.'],
  description: 'A plan, movement guidance, and a clear log.',
  imageFile: 'product-exercise-squat.jpg',
});

renderFeatureCard({
  fileName: 'social-exercise-guides',
  label: 'EXERCISE GUIDES',
  titleLines: ['See the movement', 'before the set.'],
  description: 'Looping demonstrations inside the workout.',
  imageFile: 'barbell-squat.webp',
  imageMimeType: 'image/webp',
  landscape: true,
});

renderFeatureCard({
  fileName: 'social-barbell-squat-guide',
  label: 'EXERCISE GUIDE',
  titleLines: ['Barbell', 'Squat'],
  description: 'Movement, muscles, and how-to steps.',
  imageFile: 'barbell-squat.webp',
  imageMimeType: 'image/webp',
  landscape: true,
});

renderFeatureCard({
  fileName: 'social-barbell-bench-press-guide',
  label: 'EXERCISE GUIDE',
  titleLines: ['Barbell', 'Bench Press'],
  description: 'Movement, muscles, and how-to steps.',
  imageFile: 'barbell-bench-press.webp',
  imageMimeType: 'image/webp',
  landscape: true,
});
