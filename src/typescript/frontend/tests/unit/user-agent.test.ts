// cspell:word KHTML
// cspell:word jsbridge
// cspell:word MIUI
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";

// Using misc user agent strings selected from a random hour of the day when these tests were made.
describe("tests a few user agent strings", () => {
  it("checks an iOS device", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 OKEx/6.96.1 (iPhone;U;iOS 18.0.1;en-ID/en-US) locale=en-US statusBarHeight/141 OKApp/(OKEx/6.96.1) brokerDomain/www.okx.com brokerId/0 jsbridge/1.1.0 theme/dark";
    expect(getBooleanUserAgentSelectors(ua).isIOS).toBe(true);
    expect(getBooleanUserAgentSelectors(ua).isMacOs).toBeFalsy();
    expect(getBooleanUserAgentSelectors(ua).isWindows).toBeFalsy();
  });
  it("checks a MacOs device", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15";
    expect(getBooleanUserAgentSelectors(ua).isIOS).toBeFalsy();
    expect(getBooleanUserAgentSelectors(ua).isMacOs).toBe(true);
    expect(getBooleanUserAgentSelectors(ua).isWindows).toBeFalsy();
  });

  it("checks an iOS device", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    expect(getBooleanUserAgentSelectors(ua).isIOS).toBeFalsy();
    expect(getBooleanUserAgentSelectors(ua).isMacOs).toBeFalsy();
    expect(getBooleanUserAgentSelectors(ua).isWindows).toBe(true);
  });
});
