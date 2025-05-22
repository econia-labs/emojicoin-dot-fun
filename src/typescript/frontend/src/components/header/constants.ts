import FEATURE_FLAGS from "lib/feature-flags";
import { ROUTES } from "router/routes";

export const NAVIGATE_LINKS = [
  { title: "arena", path: ROUTES.arena } as const,
  { title: "stats", path: ROUTES.stats } as const,
  { title: "pools", path: ROUTES.pools } as const,
  { title: "launch", path: ROUTES.launch } as const,
  { title: "cult", path: ROUTES.cult } as const,
].filter(({ title }) => {
  return title !== "arena" || FEATURE_FLAGS.Arena;
});
