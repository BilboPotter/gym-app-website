import { defineConfig } from 'astro/config';
import { siteConfig } from './astro-src/lib/site.mjs';

export default defineConfig({
  site: siteConfig.siteUrl,
  output: 'static',
  srcDir: './astro-src',
  publicDir: './astro-public',
  outDir: './astro-dist',
});
