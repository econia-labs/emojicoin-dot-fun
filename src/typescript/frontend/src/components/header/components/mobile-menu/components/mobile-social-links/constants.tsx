import TwitterOutlineIcon from "components/svg/icons/TwitterOutlineIcon";
import { LINKS } from "lib/env";
import DiscordOutlineIcon from "@icons/DiscordOutlineIcon";
import { ROUTES } from "router/routes";

export const SOCIAL_ICONS = [
  { icon: DiscordOutlineIcon, href: LINKS?.discord ?? ROUTES.notFound },
  { icon: TwitterOutlineIcon, href: LINKS?.x ?? ROUTES.notFound },
];
