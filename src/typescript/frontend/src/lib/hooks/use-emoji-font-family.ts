// cspell:word noto
import { useUserSettings } from "context/event-store-context";
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";
import { useMemo } from "react";
import { notoColorEmoji } from "styles/fonts";

/**
 * A hook to retrieve the proper font, given the user agent string stored in global state.
 */
export const useEmojiFontConfig = () => {
  const userAgent = useUserSettings((s) => s.userAgent);
  const { isIOS, isMacOs, emojiFontClassName } = useMemo(() => {
    const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
    const emojiFontClassName = isIOS || isMacOs ? "" : notoColorEmoji.className;
    return { isIOS, isMacOs, emojiFontClassName };
  }, [userAgent]);

  return { isIOS, isMacOs, emojiFontClassName };
};
