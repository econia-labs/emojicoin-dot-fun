// cspell:word noto
// cspell:word NOTO

import type { SymbolEmoji } from "@/sdk/index";

import { getBooleanUserAgentSelectors } from "../user-agent-selectors";

// Cache for loaded color modules
let appleColorsPromise: Promise<Record<string, string>> | null = null;
let notoColorsPromise: Promise<Record<string, string>> | null = null;

/**
 * Loads the emoji color module dynamically based on platform.
 *
 * Uses lazy loading via dynamic imports to only fetch the required color set
 * (either Apple or Noto, not both) based on the user's device.
 * @param isApple - True for Apple emoji colors, false for Noto emoji colors
 * @returns Promise resolving to the emoji color mapping
 */
const getColorModule = async (isApple: boolean) => {
  if (isApple) {
    if (!appleColorsPromise) {
      appleColorsPromise = import("./symbol-emojis/apple-symbol-emoji-colors").then(
        (module) => module.default
      );
    }
    return appleColorsPromise;
  } else {
    if (!notoColorsPromise) {
      notoColorsPromise = import("./symbol-emojis/noto-symbol-emoji-colors").then(
        (module) => module.default
      );
    }
    return notoColorsPromise;
  }
};

const getSingleEmojiColor = async (emoji: SymbolEmoji, dataSource: Record<string, string>) => {
  if (!(emoji in dataSource)) {
    console.error(`Emoji ${emoji} not found in color data. Returning default color`);
    return "#000000";
  }

  return `#${dataSource[emoji]}`;
};

export const getEmojiColor = async (emoji: SymbolEmoji[], userAgentArg?: string) => {
  const userAgent = userAgentArg || window?.navigator.userAgent || "";
  if (!userAgent) console.warn("No user agent string in `getEmojiColor`");
  const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
  const dataSource = await getColorModule(isIOS || isMacOs || false);
  const colors = await Promise.all(emoji.map((e) => getSingleEmojiColor(e, dataSource)));
  return colors;
};
