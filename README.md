# Maatriks gym website

Public website for the Maatriks gym mobile app at `jõmm.ee`.

The canonical HTTPS origin is `https://xn--jmm-ona.ee`, the ASCII form of the
internationalized domain. Every HTML route is `noindex`; crawlers remain allowed
to read those directives. Support email remains `info@maatriks.ai` and app auth
handoffs retain the `maatriks://` scheme.

The site is deployed as Astro static output. Astro is the single build path for local development, CI, and GitHub Pages deployment.

## What This Repo Owns

- homepage
- blog index and blog posts
- privacy policy
- terms and conditions
- support page
- account deletion page
- password reset help page
- auth callback handoff page
- password update handoff page

## Route Surface

- `/`
- `/blog`
- `/privacy`
- `/terms`
- `/support`
- `/delete-account`
- `/forgot-password`
- `/auth/callback`
- `/update-password`

## Config

Runtime-facing values live in `site.config.json`.

Important keys:

- `companyName`
- `appName`
- `supportEmail`
- `siteUrl`
- `privacyUrl`
- `termsUrl`
- `supportUrl`
- `deleteAccountUrl`
- `forgotPasswordUrl`
- `iosAppStoreUrl`
- `googlePlayUrl`
- `authCallbackDeepLink`
- `passwordResetDeepLink`

## Local Development

Start the Astro dev server:

```bash
npm run astro:dev
```

Build the production site:

```bash
npm run build
```

Explicit Astro build alias:

```bash
npm run astro:build
```

Verify Astro output:

```bash
npm run verify
```

Explicit Astro verify alias:

```bash
npm run astro:verify
```

`astro:dev` and `astro:build` both generate `astro-public/` before running. Do not edit `astro-public/` directly.

## Output Directories

- `astro-dist/` — deployable Astro output
- `astro-public/` — generated public asset mirror for Astro dev/build

## Blog Authoring

Blog posts live in `src/blog/`.

Start a new post by copying `src/blog/_template.html`.

Required metadata:

- `title`
- `slug`
- `date`
- `description`

Optional metadata:

- `category`

## Deployment

Deployment guidance lives in `DEPLOYMENT.md`.

## Product Docs

- `PRD.md` — current product and route requirements
- `ROADMAP.md` — current forward-looking priorities
