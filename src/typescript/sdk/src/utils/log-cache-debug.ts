/* eslint-disable import/no-unused-modules */
import { type CacheLogColors, cacheLogColors as color, enableColorsIfAllowed, VERCEL_TARGET_ENV } from "..";

// Get the time locally in local development.
// In CI, prod, preview, etc, just use UTC time.
// Format it like an ISO string but with no timezone indication.
const getTimeString = (d: Date = new Date()) =>
  VERCEL_TARGET_ENV !== "development" && process.env.NODE_ENV !== "development"
    ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, -1)
    : d.toISOString();

export default function logWithTime(s: string) {
  console.debug(color.muted(`[${getTimeString()}] `) + s);
}

type LogArgs = {
  cacheKey: string;
  label: [string, CacheLogColors | undefined];
  msg?: string;
  uuid?: string;
  fetchUrl?: string;
  alwaysLog?: boolean;
};

export async function logCacheDebug({
  cacheKey,
  label,
  msg,
  uuid,
  fetchUrl,
  alwaysLog = false,
}: LogArgs) {
  if (!process.env.CACHE_HANDLER_DEBUG && !alwaysLog) return;
  enableColorsIfAllowed();

  const [labelText, labelColor] = label;

  const formattedUuid = color.lightGray("id-" + (uuid?.split("-").at(1) || "").slice(0, 6));
  const cacheKeyAndUrl = color.muted(`${cacheKey} ${fetchUrl}`);
  const PADDING = 4;
  const labelPadding = " ".repeat(Math.max(0, PADDING - labelText.length));
  const formattedLabel = color[labelColor ?? "none"](`[${labelText}] ${labelPadding}`);
  const formattedMessage = msg ? color.none(msg) : "";
  logWithTime(`${formattedUuid} ${formattedLabel} ${formattedMessage} ${cacheKeyAndUrl}`);
}
