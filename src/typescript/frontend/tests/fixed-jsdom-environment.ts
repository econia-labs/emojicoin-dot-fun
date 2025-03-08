import JSDOMEnvironment from "jest-environment-jsdom";
import { TextEncoder, TextDecoder } from "util";

/**
 * Extends the JSDOM test environment to add missing globals that Jest does not provide by default.
 *
 * This ensures compatibility with APIs (even in external dependencies) that rely on these globals.
 *
 * Implemented similarly to [jest-fixed-jsdom](https://www.npmjs.com/package/jest-fixed-jsdom)
 * */
class FixedJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config: any, context: any) {
    super(config, context);

    if (typeof this.global.TextEncoder === "undefined") {
      this.global.TextEncoder = TextEncoder;
    }

    if (typeof this.global.TextDecoder === "undefined") {
      // @ts-expect-error Ignoring the improper type resolution
      this.global.TextDecoder = TextDecoder;
    }
  }
}

export default FixedJSDOMEnvironment;
