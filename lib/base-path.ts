/**
 * GitHub Pages serves a project site from `/<repo>/`, so the app has to know
 * the prefix it is mounted under. `next/link` and the router apply `basePath`
 * themselves; everything hand-written (the manifest, the icons, the service
 * worker) has to use this.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Absolute URL path for a file in `public/`. */
export const asset = (path: string): string => `${BASE_PATH}${path}`;
