import Twitter from "components/svg/icons/Twitter";
import { LINKS } from "lib/env";
import { ROUTES } from "router/routes";

import Discord from "@/icons/Discord";

export const SOCIAL_ICONS = [
  { icon: Discord, href: LINKS?.discord ?? ROUTES["not-found"] },
  { icon: Twitter, href: LINKS?.x ?? ROUTES["not-found"] },
];
