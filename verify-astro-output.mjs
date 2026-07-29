import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { loadBlogPosts } from './astro-src/lib/blog.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'astro-dist');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

function readFile(relativePath, encoding = 'utf8') {
  const fullPath = path.join(DIST, relativePath);
  assert(fs.existsSync(fullPath), `Missing required file: ${fullPath}`);
  return fs.readFileSync(fullPath, encoding);
}

function assertExists(relativePath) {
  readFile(relativePath);
}

function resolveScriptFileFromPage(relativeHtmlPath, scriptNamePrefix) {
  const html = readFile(relativeHtmlPath);
  const escapedPrefix = scriptNamePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<script\\s+src="/scripts/(${escapedPrefix}[^"]+)"`, 'i'));

  assert(match?.[1], `Missing ${scriptNamePrefix} script reference in ${relativeHtmlPath}`);

  return {
    html,
    scriptFileName: match[1],
  };
}

function verifyHtmlRoutes() {
  const htmlFiles = [
    'index.html',
    '404.html',
    'terms/index.html',
    'terms.html',
    'privacy/index.html',
    'privacy.html',
    'support/index.html',
    'support.html',
    'delete-account/index.html',
    'delete-account.html',
    'forgot-password/index.html',
    'forgot-password.html',
    'auth/callback/index.html',
    'auth/callback.html',
    'update-password/index.html',
    'update-password.html',
    'blog/index.html',
  ];

  htmlFiles.forEach(assertExists);
}

function verifyBlogPosts() {
  const posts = loadBlogPosts();
  const expectedSlugs = posts.map((post) => post.slug).sort();
  const blogDir = path.join(DIST, 'blog');
  const builtSlugs = fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert(
    builtSlugs.join('\n') === expectedSlugs.join('\n'),
    'Blog post directories in astro-dist do not match src/blog slugs',
  );

  expectedSlugs.forEach((slug) => assertExists(path.join('blog', slug, 'index.html')));
}

function verifyStaticArtifacts() {
  [
    'blog/feed.xml',
    'robots.txt',
    'sitemap.xml',
    'CNAME',
    '.nojekyll',
    'favicon.svg',
    'favicon.ico',
    '.well-known/apple-app-site-association',
    '.well-known/assetlinks.json',
    'apple-app-site-association',
    'assets/social-home.png',
    'assets/social-blog.png',
  ].forEach(assertExists);

  const cname = readFile('CNAME').trim();
  assert(cname === getSiteHost(CONFIG.siteUrl), `Unexpected CNAME value: ${cname}`);

  const robots = readFile('robots.txt');
  assert(
    robots.includes(`Sitemap: ${CONFIG.siteUrl}/sitemap.xml`),
    'robots.txt is missing the sitemap URL',
  );

  const sitemap = readFile('sitemap.xml');
  [
    `${CONFIG.siteUrl}/`,
    `${CONFIG.siteUrl}/privacy`,
    `${CONFIG.siteUrl}/terms`,
    `${CONFIG.siteUrl}/support`,
    `${CONFIG.siteUrl}/blog`,
  ].forEach((url) => {
    assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml is missing ${url}`);
  });
}

function verifyAssetFingerprinting() {
  const indexHtml = readFile('index.html');
  const cssMatch = indexHtml.match(/href="(\/styles\/main\.[^"]+\.css)"/);

  assert(cssMatch?.[1], 'Homepage is missing the hashed stylesheet reference');
  assertExists(cssMatch[1].slice(1));
  assert(
    indexHtml.includes(`${CONFIG.siteUrl}/assets/social-home.png`),
    'Homepage metadata is missing the current social preview image',
  );

  assert(
    !fs.existsSync(path.join(DIST, 'styles', 'main.css')),
    'astro-dist/styles/main.css should not exist after postprocess cleanup',
  );

  ['auth-callback.js', 'update-password.js', 'main.js', 'consent.js'].forEach((fileName) => {
    assert(
      !fs.existsSync(path.join(DIST, 'scripts', fileName)),
      `astro-dist/scripts/${fileName} should not exist after postprocess cleanup`,
    );
  });
}

function createAuthHandoffElement() {
  const attributes = new Map();
  const classes = new Set();

  return {
    attributes,
    classList: {
      add(value) {
        classes.add(value);
      },
      contains(value) {
        return classes.has(value);
      },
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    style: {},
    textContent: '',
  };
}

function runAuthHandoffFixture({ hash = '', pathname, scriptBody, search = '' }) {
  const events = [];
  const elements = Object.fromEntries(
    ['auth-card', 'spinner', 'open-app', 'status', 'fallback'].map((id) => [
      id,
      createAuthHandoffElement(),
    ]),
  );
  elements['open-app'].setAttribute('href', '#');
  const calls = {
    listeners: [],
    redirects: [],
    timeouts: [],
  };
  const document = {
    hidden: false,
    title: 'maatriks.ai auth handoff',
    addEventListener(type) {
      calls.listeners.push(type);
    },
    getElementById(id) {
      return elements[id] ?? null;
    },
  };
  const window = {
    history: {
      replaceState(_state, _title, nextPathname) {
        events.push('scrub');
        assert(nextPathname === pathname, `Unexpected scrub pathname: ${nextPathname}`);
      },
    },
    location: {
      hash,
      pathname,
      search,
      replace(target) {
        events.push('redirect');
        calls.redirects.push(target);
      },
    },
  };
  window.window = window;

  vm.runInNewContext(
    scriptBody,
    {
      URLSearchParams,
      document,
      encodeURIComponent,
      setTimeout(callback, delay) {
        calls.timeouts.push({ callback, delay });
        return calls.timeouts.length;
      },
      window,
    },
    {
      filename: pathname,
      timeout: 1_000,
    },
  );

  return { calls, elements, events, window };
}

function expectedDeepLink(deepLink, entries) {
  if (entries.length === 0) {
    return deepLink;
  }

  return `${deepLink}?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')}`;
}

function verifyValidAuthHandoffFixture({
  deepLink,
  entries,
  hash,
  label,
  pathname,
  scriptBody,
  search,
}) {
  const result = runAuthHandoffFixture({ hash, pathname, scriptBody, search });
  const expected = expectedDeepLink(deepLink, entries);

  assert(
    result.calls.redirects.length === 1 && result.calls.redirects[0] === expected,
    `${label}: unexpected redirect ${result.calls.redirects.join(', ')}`,
  );
  assert(
    result.elements['open-app'].getAttribute('href') === expected,
    `${label}: manual action does not match the redirect`,
  );
  assert(
    result.elements['open-app'].getAttribute('aria-disabled') === null,
    `${label}: valid manual action is disabled`,
  );
  assert(
    result.events.join(',') === 'scrub,redirect',
    `${label}: sensitive URL was not scrubbed before redirect`,
  );
  assert(result.calls.timeouts.length === 1, `${label}: expected one fallback timer`);
  assert(
    result.calls.listeners.join(',') === 'visibilitychange',
    `${label}: expected one visibility listener`,
  );
  assert(
    result.window.__maatriksAuthHandoffContract === 'query-fragment-merge-v2',
    `${label}: missing auth handoff contract marker`,
  );

  const parsedTarget = new URL(expected);
  entries.forEach(([key, value]) => {
    assert(
      parsedTarget.searchParams.get(key) === value,
      `${label}: destination changed decoded ${key}`,
    );
    assert(
      parsedTarget.searchParams.getAll(key).length === 1,
      `${label}: destination repeated ${key}`,
    );
  });
}

function verifyInvalidAuthHandoffFixture({ hash, label, pathname, scriptBody, search }) {
  const result = runAuthHandoffFixture({ hash, pathname, scriptBody, search });

  assert(result.calls.redirects.length === 0, `${label}: invalid input opened the app`);
  assert(result.calls.timeouts.length === 0, `${label}: invalid input installed a timer`);
  assert(result.calls.listeners.length === 0, `${label}: invalid input installed a listener`);
  assert(result.events.join(',') === 'scrub', `${label}: invalid input was not scrubbed`);
  assert(
    result.elements.status.textContent === 'Invalid authentication link',
    `${label}: invalid status copy is missing`,
  );
  assert(
    result.elements['auth-card'].classList.contains('auth-error'),
    `${label}: invalid card state is missing`,
  );
  assert(
    result.elements.fallback.classList.contains('visible'),
    `${label}: invalid fallback is hidden`,
  );
  assert(
    result.elements.spinner.style.display === 'none',
    `${label}: invalid spinner remains visible`,
  );
  assert(
    result.elements['open-app'].getAttribute('href') === null &&
      result.elements['open-app'].getAttribute('aria-disabled') === 'true',
    `${label}: invalid manual action remains enabled`,
  );
}

function verifyAuthHandoffBehavior({ deepLink, pathname, scriptBody, scriptFileName }) {
  const base = { deepLink, pathname, scriptBody };
  const complexToken = 'plus+slash/=and&percent% space õ';
  const encodedComplexToken = 'plus%2Bslash%2F%3Dand%26percent%25%20space%20%C3%B5';

  assert(
    scriptBody.includes('query-fragment-merge-v2'),
    `Expected ${scriptFileName} to contain the reviewed auth handoff contract`,
  );

  [
    {
      entries: [
        ['auth_state', 'S'],
        ['access_token', 'A'],
        ['refresh_token', 'R'],
        ['type', 'recovery'],
      ],
      hash: '#access_token=A&refresh_token=R&type=recovery',
      label: `${scriptFileName}: combined query and fragment`,
      search: '?auth_state=S',
    },
    {
      entries: [
        ['auth_state', 'S'],
        ['access_token', 'A'],
      ],
      hash: '#auth_state=S&access_token=A&access_token=A',
      label: `${scriptFileName}: identical repeated values`,
      search: '?auth_state=S&auth_state=%53',
    },
    {
      entries: [
        ['auth_state', 'S'],
        ['access_token', 'A'],
      ],
      hash: '#access_token=A&constructor=fragment-value',
      label: `${scriptFileName}: unknown and prototype keys ignored`,
      search: '?utm_source=x&constructor=query-value&__proto__=polluted&auth_state=S',
    },
    {
      entries: [
        ['auth_state', 'S'],
        ['access_token', complexToken],
      ],
      hash: `#access_token=${encodedComplexToken}`,
      label: `${scriptFileName}: canonical safe encoding`,
      search: '?auth_state=S',
    },
    {
      entries: [
        ['type', 'signup'],
        ['access_token', 'A'],
        ['refresh_token', 'R'],
      ],
      hash: '#type=signup&access_token=A&refresh_token=R',
      label: `${scriptFileName}: fragment-only signup`,
      search: '',
    },
    {
      entries: [
        ['token_hash', 'H'],
        ['type', 'signup'],
      ],
      hash: '',
      label: `${scriptFileName}: query-only token hash`,
      search: '?token_hash=H&type=signup',
    },
    {
      entries: [],
      hash: '',
      label: `${scriptFileName}: empty valid handoff`,
      search: '',
    },
  ].forEach((fixture) => verifyValidAuthHandoffFixture({ ...base, ...fixture }));

  [
    {
      hash: '',
      label: `${scriptFileName}: conflicting query duplicate`,
      search: '?auth_state=S&auth_state=T',
    },
    {
      hash: '#access_token=A&access_token=B',
      label: `${scriptFileName}: conflicting fragment duplicate`,
      search: '',
    },
    {
      hash: '#auth_state=T&access_token=A',
      label: `${scriptFileName}: conflicting cross-component duplicate`,
      search: '?auth_state=S',
    },
  ].forEach((fixture) => verifyInvalidAuthHandoffFixture({ ...base, ...fixture }));
}

function verifyAuthPage({ htmlPath, scriptNamePrefix, expectedDeepLink, expectedActionId }) {
  const { html, scriptFileName } = resolveScriptFileFromPage(htmlPath, scriptNamePrefix);

  assert(html.includes(expectedActionId), `Missing ${expectedActionId} in ${htmlPath}`);
  assert(html.includes('content="no-referrer"'), `Expected no-referrer policy in ${htmlPath}`);
  assert(html.includes('Content-Security-Policy'), `Expected CSP meta in ${htmlPath}`);
  assert(
    !html.includes('id="cookie-banner"'),
    `Auth page should not include cookie banner: ${htmlPath}`,
  );
  assert(
    !html.includes('/scripts/consent'),
    `Auth page should not include consent script: ${htmlPath}`,
  );

  const scriptBody = readFile(path.join('scripts', scriptFileName));
  assert(
    scriptBody.includes(expectedDeepLink),
    `Expected ${scriptFileName} to contain ${expectedDeepLink}`,
  );
  assert(
    scriptBody.includes('history.replaceState'),
    `Expected ${scriptFileName} to clear sensitive URL state`,
  );
  assert(
    scriptBody.includes('token_hash'),
    `Expected ${scriptFileName} to whitelist token_hash for Supabase flows`,
  );
  assert(
    scriptBody.includes('auth_state'),
    `Expected ${scriptFileName} to preserve auth_state for mobile OAuth handoff`,
  );

  verifyAuthHandoffBehavior({
    deepLink: expectedDeepLink,
    pathname: `/${htmlPath.replace(/\/index\.html$/, '')}`,
    scriptBody,
    scriptFileName,
  });
}

function verifyAppleAppSiteAssociation() {
  const expectedAppId = 'Y29W4CL48T.ai.maatriks.app';

  ['.well-known/apple-app-site-association', 'apple-app-site-association'].forEach(
    (relativePath) => {
      const json = JSON.parse(readFile(relativePath));
      const details = json?.applinks?.details;

      assert(Array.isArray(details), `Expected applinks.details array in ${relativePath}`);
      assert(
        details.some((entry) => entry?.appID === expectedAppId),
        `Expected ${relativePath} to include appID ${expectedAppId}`,
      );
    },
  );
}

function verifyAndroidAssetLinks() {
  const json = JSON.parse(readFile('.well-known/assetlinks.json'));
  const expectedFingerprint =
    '18:77:6E:6A:D6:5C:B7:83:A8:71:9D:0E:CD:E1:32:13:62:2A:A6:16:61:56:94:82:33:7D:BE:0E:A8:AC:70:35';

  assert(Array.isArray(json), 'Expected assetlinks.json to be an array');
  assert(
    json.some((entry) => {
      return (
        entry?.target?.namespace === 'android_app' &&
        entry?.target?.package_name === 'ai.maatriks.app' &&
        entry?.relation?.includes('delegate_permission/common.handle_all_urls') &&
        entry?.target?.sha256_cert_fingerprints?.includes(expectedFingerprint)
      );
    }),
    'Expected assetlinks.json to include the maatriks Android app association',
  );
}

function verifyStoreLinks() {
  assert(
    CONFIG.iosAppStoreUrl === 'https://apps.apple.com/app/id6779895703',
    `Unexpected App Store URL: ${CONFIG.iosAppStoreUrl}`,
  );
  assert(
    CONFIG.googlePlayUrl === 'https://play.google.com/store/apps/details?id=ai.maatriks.app',
    `Unexpected Google Play URL: ${CONFIG.googlePlayUrl}`,
  );
  assert(CONFIG.googlePlayUrl !== '#', 'Google Play URL must not be a placeholder');

  const indexHtml = readFile('index.html');
  assert(indexHtml.includes(CONFIG.iosAppStoreUrl), 'Homepage is missing the App Store URL');
  assert(indexHtml.includes(CONFIG.googlePlayUrl), 'Homepage is missing the Google Play URL');
}

function verifyTimedExerciseDemo() {
  const indexHtml = readFile('index.html');
  const sourceScript = fs.readFileSync(path.join(ROOT, 'src', 'scripts', 'main.js'), 'utf8');
  const sourceCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'main.css'), 'utf8');

  [
    'assets/product-timed-exercise-active.jpg',
    'assets/product-timed-exercise-demo-start.jpg',
    'assets/product-timed-exercise-demo-saved.jpg',
  ].forEach(assertExists);

  assert(
    indexHtml.includes('data-timed-exercise-demo'),
    'Homepage is missing the timed-exercise HTML demo',
  );
  assert(
    indexHtml.includes('data-target-seconds="30"') &&
      indexHtml.includes('data-finish-seconds="35"'),
    'Timed-exercise demo does not run from its 30-second target through five seconds of overtime',
  );
  assert(
    indexHtml.includes('data-timed-exercise-progress') &&
      indexHtml.includes('data-timed-exercise-overtime'),
    'Timed-exercise demo is missing its live SVG progress rings',
  );
  assert(
    (indexHtml.match(/stroke-dashoffset="1"/g) ?? []).length >= 2 &&
      !sourceCss
        .slice(
          sourceCss.indexOf('.timed-exercise-dial-progress,'),
          sourceCss.indexOf('.timed-exercise-dial-progress {'),
        )
        .includes('stroke-dashoffset'),
    'Timed-exercise ring initialization still overrides live progress updates',
  );
  assert(
    indexHtml.includes('dataset.finishSeconds') &&
      indexHtml.includes('target-reached') &&
      indexHtml.includes('stroke-dashoffset'),
    'Homepage is missing the timed-exercise state-machine initialization',
  );
  assert(
    sourceScript.includes('Math.min(elapsed / targetSeconds, 1)') &&
      sourceScript.includes('Math.min(overtimeSeconds / targetSeconds, 1)') &&
      sourceScript.includes('window.setInterval(sampleTimer, 1000)') &&
      sourceScript.includes('" over"'),
    'Timed-exercise demo is missing synchronized target and overtime ring progress',
  );
  assert(
    sourceCss.includes('animation: timed-exercise-target 400ms linear') &&
      sourceCss.includes('translateX(-8px)') &&
      sourceCss.includes('translateX(7px)') &&
      sourceCss.includes('translateX(-5px)') &&
      sourceCss.includes('translateX(3px)'),
    'Timed-exercise demo is missing the live-app target pop and shake',
  );
  assert(
    !indexHtml.includes('product-timed-exercise-live.mp4'),
    'Homepage still references the retired timer video',
  );
  assert(
    !fs.existsSync(path.join(DIST, 'assets', 'product-timed-exercise-live.mp4')),
    'Retired timer video still exists in the production output',
  );
}

function verifyHomepageContentLayout() {
  const indexHtml = readFile('index.html');
  const sourcePage = fs.readFileSync(path.join(ROOT, 'astro-src', 'pages', 'index.astro'), 'utf8');
  const sourceCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'main.css'), 'utf8');

  ['Track your weights and sets', 'Review results', 'See the progress'].forEach((heading) => {
    assert(indexHtml.includes(heading), `Homepage is missing the updated journey heading: ${heading}`);
  });

  [
    'Track what actually happened',
    'Finish with a clear review',
    'Watch the work add up',
    'See each movement, log the work as it happens, and finish with a clear record of what you completed.',
    'Optional warm-up rest',
    'Timed sets in place',
  ].forEach((retiredCopy) => {
    assert(!indexHtml.includes(retiredCopy), `Homepage still contains retired copy: ${retiredCopy}`);
  });

  assert(
    !sourcePage.includes('class="timers-stills"') &&
      !sourceCss.includes('.timers-stills') &&
      !sourceCss.includes('.timer-still'),
    'Removed timing cards still have homepage markup or styling',
  );

  const productCardSources = sourcePage
    .slice(sourcePage.indexOf('<div class="product-proof-grid">'), sourcePage.indexOf('</section>', sourcePage.indexOf('<div class="product-proof-grid">')))
    .split('<article class="product-proof-card reveal">')
    .slice(1);

  assert(productCardSources.length === 3, 'Homepage product proof should contain exactly three cards');
  productCardSources.forEach((cardSource, index) => {
    assert(
      cardSource.indexOf('class="product-proof-copy"') < cardSource.indexOf('class="product-proof-media'),
      `Product proof card ${index + 1} does not place its information above its screenshot`,
    );
  });
}

function verifyAutoProgressionGraph() {
  const indexHtml = readFile('index.html');
  const cssMatch = indexHtml.match(/href="(\/styles\/main\.[^"]+\.css)"/);

  assert(
    indexHtml.includes('id="progression-glow-gradient"'),
    'Homepage is missing the progressive Auto-progression glow',
  );
  assert(
    indexHtml.includes('stop-opacity="0.286"'),
    'Auto-progression glow is missing its 30% stronger endpoint',
  );
  assert(
    indexHtml.includes('S1110 235 1200 190'),
    'Auto-progression line does not reach the visible upper-right boundary',
  );
  assert(
    indexHtml.includes('data-auto-progression-graph'),
    'Auto-progression graph is missing its dedicated viewport trigger',
  );
  assert(
    !indexHtml.includes('class="auto-progression-graph reveal"'),
    'Auto-progression graph is still attached to the generic early reveal observer',
  );
  assert(
    indexHtml.includes('threshold:.35') &&
      indexHtml.includes('rootMargin:"0px 0px -8% 0px"'),
    'Auto-progression graph is missing its delayed section observer',
  );

  assert(cssMatch?.[1], 'Homepage is missing the hashed stylesheet reference');
  const mainCss = readFile(cssMatch[1].slice(1));
  const sourceCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'main.css'), 'utf8');
  const graphCssStart = sourceCss.indexOf('.auto-progression-graph {');
  const graphCssEnd = sourceCss.indexOf('.auto-progression-layout {', graphCssStart);
  const graphCss = sourceCss.slice(graphCssStart, graphCssEnd);
  assert(
    mainCss.includes('clip-path:inset(0 100% 0 0)') &&
      mainCss.includes('clip-path:inset(0)'),
    'Auto-progression graph is missing its single synchronized reveal',
  );
  assert(
    graphCssStart >= 0 &&
      graphCssEnd > graphCssStart &&
      !graphCss.includes('stroke-dashoffset') &&
      !graphCss.includes('transition-delay'),
    'Auto-progression graph still contains stitched animation timings',
  );
}

function main() {
  verifyHtmlRoutes();
  verifyBlogPosts();
  verifyStaticArtifacts();
  verifyAssetFingerprinting();

  verifyAuthPage({
    htmlPath: 'auth/callback/index.html',
    scriptNamePrefix: 'auth-callback',
    expectedDeepLink: CONFIG.authCallbackDeepLink,
    expectedActionId: 'id="open-app"',
  });

  verifyAuthPage({
    htmlPath: 'update-password/index.html',
    scriptNamePrefix: 'update-password',
    expectedDeepLink: CONFIG.passwordResetDeepLink,
    expectedActionId: 'id="open-app"',
  });

  verifyAppleAppSiteAssociation();
  verifyAndroidAssetLinks();
  verifyStoreLinks();
  verifyTimedExerciseDemo();
  verifyHomepageContentLayout();
  verifyAutoProgressionGraph();

  console.log('Verified Astro build output.');
}

main();
