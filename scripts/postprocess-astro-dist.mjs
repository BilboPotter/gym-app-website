import fs from 'node:fs';
import path from 'node:path';
import { siteConfig } from '../astro-src/lib/site.mjs';
import { loadBlogPosts } from '../astro-src/lib/blog.mjs';
import { getStaticSeoPages } from '../astro-src/lib/seo-pages.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'astro-dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

function copyAlias(routeOut) {
  if (!routeOut.endsWith('/index.html')) {
    return;
  }

  const sourcePath = path.join(DIST, routeOut);
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const aliasPath = path.join(DIST, `${routeOut.slice(0, -'/index.html'.length)}.html`);
  ensureDir(path.dirname(aliasPath));
  fs.copyFileSync(sourcePath, aliasPath);
}

function writeFile(relativePath, content) {
  const outputPath = path.join(DIST, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, content, 'utf8');
}

function removeFile(relativePath) {
  const outputPath = path.join(DIST, relativePath);
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { force: true });
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(routePath) {
  return `${siteConfig.siteUrl}${routePath}`;
}

function main() {
  const aliasRoutes = [
    'terms/index.html',
    'privacy/index.html',
    'support/index.html',
    'delete-account/index.html',
    'forgot-password/index.html',
    'auth/callback/index.html',
    'update-password/index.html',
  ];

  aliasRoutes.forEach(copyAlias);

  [
    'styles/main.css',
    'scripts/auth-callback.js',
    'scripts/consent.js',
    'scripts/main.js',
    'scripts/update-password.js',
  ].forEach(removeFile);

  writeFile('CNAME', `${getSiteHost(siteConfig.siteUrl)}\n`);
  writeFile('.nojekyll', '');

  const posts = loadBlogPosts();
  const sitemapEntries = [
    ...getStaticSeoPages().map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.lastModified,
    })),
    ...posts.map((post) => ({
      url: `${siteConfig.siteUrl}/blog/${post.slug}`,
      lastModified: post.dateModified,
    })),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(({ url, lastModified }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`).join('\n')}
</urlset>`;
  writeFile('sitemap.xml', sitemapXml);

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteConfig.siteUrl}/sitemap.xml`;
  writeFile('robots.txt', robotsTxt);
}

main();
