import { VERCEL, VERCEL_TARGET_ENV } from "../const";

const RESET = "\x1b[0m";
const GRAY = "\x1b[90m";
const YELLOW = "\x1b[33m";
const WARNING = "\x1b[38;5;202m";
const ERROR = "\x1b[38;5;009m";
const SUCCESS = "\x1b[38;5;221m";
const INFO = "\x1b[1;35m";
const DARK_GRAY = "\x1b[38;5;238m";
const LIGHT_GRAY = "\x1b[37m";

let enabled: boolean | undefined = undefined;

export const enableColorsIfAllowed = () => {
  // Return if it's already been set.
  if (typeof enabled === "boolean") return;
  const noColor =
    VERCEL ||
    VERCEL_TARGET_ENV === "production" ||
    VERCEL_TARGET_ENV === "release-preview" ||
    process.env.NODE_DISABLE_COLORS ||
    process.env.TERM === "dumb" ||
    process.env.FORCE_COLOR === "0" ||
    process.env.NO_COLOR;
  enabled = !noColor;
};

export type CacheLogColors = keyof typeof cacheLogColors;

const maybeColor = (color: string) => (s: string) => (enabled ? `${color}${s}${RESET}` : s);

export const cacheLogColors = {
  none: (s: string) => s,
  info: maybeColor(INFO),
  warning: maybeColor(WARNING),
  error: maybeColor(ERROR),
  success: maybeColor(SUCCESS),
  muted: maybeColor(GRAY),
  debug: maybeColor(DARK_GRAY),
  lightGray: maybeColor(LIGHT_GRAY),
  fetchGet: maybeColor(YELLOW),
};
