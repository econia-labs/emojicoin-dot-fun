/**
 * TypeScript module declarations for static image imports.
 *
 * These declarations allow `tsc` to understand how to handle image files
 * like .svg and .png that are imported directly in components.
 *
 * This is necessary because Next.js supports these imports via Webpack,
 * but vanilla TypeScript (used in `tsc`) does not natively understand them.
 */
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}
