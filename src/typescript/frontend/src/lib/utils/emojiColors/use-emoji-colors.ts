import { useQuery } from "@tanstack/react-query";

import type { SymbolEmoji } from "@/sdk/index";

import { getEmojiColor } from "./emoji-color-data";

/**
 * A hook to fetch color information for emojis.
 *
 * This is a helper to get emoji colors asynchronously. Since we have a dynamic import for the module
 * with colors, `getEmojiColor` has to be async, which means we can't use a simple `useMemo`.
 * Instead, this hook wraps the async operation with React Query for easier data fetching.
 *
 * @param emoji - Array of emoji symbols to get colors for
 * @returns Query result containing the emoji colors when loaded
 */
export const useEmojiColors = (emoji: SymbolEmoji[]) => {
  return useQuery({
    queryKey: ["useEmojiColors", emoji],
    queryFn: async () => await getEmojiColor(emoji),
  });
};
