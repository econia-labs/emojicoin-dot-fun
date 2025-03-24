import TwitterOutlineIcon from "components/svg/icons/TwitterOutlineIcon";
import { LINKS } from "lib/env";
import { ROUTES } from "router/routes";

import DiscordOutlineIcon from "@/icons/DiscordOutlineIcon";

export const SOCIAL_ICONS = [
  { icon: DiscordOutlineIcon, href: LINKS?.discord ?? ROUTES["not-found"] },
  { icon: TwitterOutlineIcon, href: LINKS?.x ?? ROUTES["not-found"] },
];
