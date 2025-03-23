// cspell:word noto
// cspell:word NOTO

import { type AnyEmoji } from "@econia-labs/emojicoin-sdk";
import { getBooleanUserAgentSelectors } from "../user-agent-selectors";
import { EMOJI_COLORS_APPLE } from "./emoji-colors-apple";
import { EMOJI_COLORS_NOTO } from "./emoji-colors-noto";
import { formatRgb } from "./emoji-color-helpers";

const getSingleEmojiColor = (
  emoji: AnyEmoji,
  dataSource: Record<string, { r: number; g: number; b: number }>
) => {
  if (!(emoji in dataSource)) {
    console.error(`Emoji ${emoji} not found in color data. Returning default color`);
    return formatRgb({ r: 0, g: 0, b: 0 });
  }

  return formatRgb(dataSource[emoji]);
};

export const getEmojiColor = (emoji: AnyEmoji[], userAgent?: string) => {
  if (!userAgent && typeof window === "undefined")
    throw new Error("If using on the server, you must provide a user agent");
  if (!userAgent) userAgent = window.navigator.userAgent;
  const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
  const dataSource = isIOS || isMacOs ? EMOJI_COLORS_APPLE : EMOJI_COLORS_NOTO;
  const colors = emoji.map((e) => getSingleEmojiColor(e, dataSource));
  if (colors.length === 1) return colors[0].hexString;
  else if (colors.length === 2) {
    // Create a linear gradient from emoji1 to emoji2.
    return `linear-gradient(to top, ${colors[0].hexString}, ${colors[1].hexString})`;
  } else {
    console.warn(`Expected 1 or 2 emojis, but got ${colors.length}. Using first emoji color.`);
    return colors[0].hexString;
  }
};
