// cspell:word MIUI
import { getSelectorsByUserAgent } from "react-device-detect";

/**
 * Boolean user agent selectors returned from @see {@link getSelectorsByUserAgent}
 *
 * @see {@link ReactDeviceDetect}
 */
export const booleanUserAgentSelectors = {
  isBrowser: null,
  isDesktop: null,
  isMobile: null,
  isTablet: null,
  isSmartTV: null,
  isConsole: null,
  isWearable: null,
  isEmbedded: null,
  isMobileSafari: null,
  isChromium: null,
  isMobileOnly: null,
  isAndroid: null,
  isWinPhone: null,
  isIOS: null,
  isChrome: null,
  isFirefox: null,
  isSafari: null,
  isOpera: null,
  isIE: null,
  isEdge: null,
  isYandex: null,
  isIOS13: null,
  isIPad13: null,
  isIPhone13: null,
  isIPod13: null,
  isElectron: null,
  isEdgeChromium: null,
  isLegacyEdge: null,
  isWindows: null,
  isMacOs: null,
  isMIUI: null,
  isSamsungBrowser: null,
};

type Keys = keyof typeof booleanUserAgentSelectors;

type Selectors = { [K in Keys]?: boolean };

const booleanSelectors = new Set(Object.keys(booleanUserAgentSelectors) as Keys[]);

export const getBooleanUserAgentSelectors = (userAgent: string): Selectors => {
  try {
    const selectors = getSelectorsByUserAgent(userAgent) ?? {};
    const res: Selectors = {};
    Object.keys(selectors)
      .map((k) =>
        selectors[k] === true && booleanSelectors.has(k as Keys) ? (k as Keys) : undefined
      )
      .filter((v) => typeof v !== "undefined")
      .forEach((k) => (res[k] = true));
    return res;
  } catch (e) {
    console.error(e);
    return {};
  }
};
