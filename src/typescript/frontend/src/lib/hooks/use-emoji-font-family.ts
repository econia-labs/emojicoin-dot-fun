// cspell:word noto
import { useUserSettings } from "context/event-store-context";
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";
import { useMemo } from "react";
import { notoColorEmoji } from "styles/fonts";

/**
 * A hook to retrieve the proper font, given the user agent string stored in global state.
 */
export const useEmojiFontClassName = () => {
  const userAgent = useUserSettings((s) => s.userAgent);
  const className = useMemo(() => {
    const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
    const maybeNotoFontClassName = isIOS || isMacOs ? "" : notoColorEmoji.className;
    return maybeNotoFontClassName;
  }, [userAgent]);

  return className;
};
