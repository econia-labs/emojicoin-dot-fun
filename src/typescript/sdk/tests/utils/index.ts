import { INTEGRATOR_ADDRESS } from "../../src/const";

export * from "../../src/utils/aptos-client";
export * from "./helpers";
export * from "./publish";
export * from "./load-priv-key";
export const DEFAULTS = {
  inputAmount: 100n,
  minOutputAmount: 1n,
  integrator: INTEGRATOR_ADDRESS,
  integratorFeeRateBPs: 0,
};
