# PRD: Maatriks Gym Public Website

Last updated: 2026-04-14

## Overview

This repository owns the Maatriks gym app's public website at `jõmm.ee`
(`https://xn--jmm-ona.ee`). Every HTML route is intentionally `noindex`.

The site exists to support the mobile app with:

1. a clear public homepage
2. legal and compliance pages
3. support and deletion guidance
4. browser-to-app auth handoff pages
5. a lightweight content surface through the blog

The website is static-first and deploys to GitHub Pages.

## Product Goals

The site should:

1. explain what the product is
2. clearly identify the company operating it
3. expose public privacy, terms, support, and deletion pages
4. support mobile auth and password-recovery handoff flows
5. be easy to maintain without a CMS

## Non-Goals

The site is not responsible for:

1. authenticated product features
2. subscription checkout
3. dashboards or account management in the browser
4. a full marketing CMS
5. app backend logic

## Primary Audiences

### Prospective users

They need to quickly understand what the app does and whether it is credible.

### Existing mobile users

They need help, legal information, and support around auth, password reset, and deletion.

### Platform and policy reviewers

They need clear public pages for:

- homepage identity
- privacy policy
- terms
- support contact
- account deletion

## Required Routes

The current public route surface is:

1. `/`
2. `/blog`
3. `/privacy`
4. `/terms`
5. `/support`
6. `/delete-account`
7. `/forgot-password`
8. `/auth/callback`
9. `/update-password`

## Route Requirements

### `/`

Purpose:

- homepage for the app
- public identity surface for users and reviewers

Must include:

1. what the app does
2. direct legal/support navigation
3. operator identity through shared site configuration
4. app store CTA area

### `/privacy`

Purpose:

- canonical public privacy policy

Must include:

1. operator identity
2. support contact
3. collected data categories
4. use of data
5. third-party processors
6. retention and deletion information
7. last updated date

### `/terms`

Purpose:

- canonical public terms and conditions page

Must include:

1. service agreement language
2. acceptable-use restrictions
3. AI/training disclaimer
4. limitation of liability language
5. governing law
6. support contact

### `/support`

Purpose:

- canonical support entrypoint

Must include:

1. support email
2. issue categories we support
3. links to related help and legal pages

### `/delete-account`

Purpose:

- public deletion instructions for compliance and user self-service

Must include:

1. how deletion is initiated in the app
2. what deletion removes
3. what may remain temporarily in backups
4. support contact

### `/forgot-password`

Purpose:

- lightweight help page for password-recovery issues

Must include:

1. where password reset starts
2. what to do if the email or app handoff fails
3. support contact

### `/auth/callback` and `/update-password`

Purpose:

- browser-to-app handoff routes for auth and password recovery

Must do:

1. parse the incoming auth payload
2. attempt to reopen the mobile app
3. provide a manual fallback path
4. preserve the required auth parameters
5. avoid loading optional cookie/analytics surfaces

## Architecture Constraints

The current architecture is:

1. Astro static build is the single deployment path
2. generated assets in `astro-public/` are build artifacts, not source files
3. content should stay file-based and commit-driven

## Editorial Model

The blog is intentionally simple:

1. posts are HTML files in `src/blog/`
2. there is no CMS
3. content is authored in-repo and deployed with the site

## Acceptance Criteria

The site is successful when:

1. every public route is accessible without login
2. legal and support pages are one click away from the main navigation or footer
3. auth handoff pages work as public callback surfaces
4. the Astro build passes output verification before deployment
5. the site can be updated by editing source files and configuration only
