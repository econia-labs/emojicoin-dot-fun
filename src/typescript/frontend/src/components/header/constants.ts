import { EXTERNAL_LINKS } from "router/external-links";
import { ROUTES } from "router/routes";

export const NAVIGATE_LINKS: { title: string; path: string }[] = [
  { title: "arena", path: ROUTES.arena },
  { title: "pools", path: ROUTES.pools },
  { title: "launch", path: ROUTES.launch },
  { title: "cult", path: ROUTES.cult },
  { title: "docs", path: EXTERNAL_LINKS.docs },
];
