export const staticSeoPages = Object.freeze([
  { path: '/', lastModified: '2026-07-29' },
  { path: '/privacy', lastModified: '2026-07-09' },
  { path: '/terms', lastModified: '2026-07-09' },
  { path: '/support', lastModified: '2026-07-09' },
  { path: '/blog', lastModified: '2026-07-29' },
  { path: '/workout-planner-app', lastModified: '2026-07-29' },
  { path: '/gym-workout-tracker', lastModified: '2026-07-29' },
  { path: '/auto-progression', lastModified: '2026-07-29' },
  { path: '/workout-timers', lastModified: '2026-07-29' },
  { path: '/beginner-workout-app', lastModified: '2026-07-29' },
  { path: '/exercise-guides', lastModified: '2026-07-29' },
  { path: '/exercise-guides/barbell-squat', lastModified: '2026-07-29' },
  { path: '/exercise-guides/barbell-bench-press', lastModified: '2026-07-29' },
  { path: '/authors/maatriks-team', lastModified: '2026-07-29' },
]);

export function getStaticSeoPages() {
  return staticSeoPages.map((entry) => ({ ...entry }));
}
