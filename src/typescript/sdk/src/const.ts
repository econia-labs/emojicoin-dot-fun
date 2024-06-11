import { AccountAddress } from "@aptos-labs/ts-sdk";

export const VERCEL = process.env.VERCEL === "1";
if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS) {
  let msg = `\n\n${"-".repeat(61)}\n\nMissing NEXT_PUBLIC_MODULE_ADDRESS environment variable\n`;
  if (!VERCEL) {
    msg += "Please run this project from the top-level, parent directory.\n";
  }
  msg += `\n${"-".repeat(61)}\n`;
  throw new Error(msg);
}
if (typeof window !== "undefined" && typeof process.env.INBOX_URL !== "undefined") {
  throw new Error("The `inbox` endpoint should not be exposed to any client components.");
}
export const MODULE_ADDRESS = (() => AccountAddress.from(process.env.NEXT_PUBLIC_MODULE_ADDRESS))();

export const LOCAL_INBOX_URL = process.env.INBOX_URL ?? "http://localhost:3000";
export const ONE_APT = 1 * 10 ** 8;
export const ONE_APTN = BigInt(ONE_APT);
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
export const DEFAULT_REGISTER_MARKET_GAS_OPTIONS = {
  maxGasAmount: ONE_APT / 100,
  gasUnitPrice: 100,
};
export const MARKET_CAP = 4_500_000_000_000n;
export const EMOJICOIN_REMAINDER = 10_000_000_000_000_000n;
export const EMOJICOIN_SUPPLY = 45_000_000_000_000_000n;
export const LP_TOKENS_INITIAL = 100_000_000_000_000n;
export const BASE_REAL_FLOOR = 0n;
export const QUOTE_REAL_FLOOR = 0n;
export const BASE_REAL_CEILING = 35_000_000_000_000_000n;
export const QUOTE_REAL_CEILING = 1_000_000_000_000n;
export const BASE_VIRTUAL_FLOOR = 14_000_000_000_000_000n;
export const QUOTE_VIRTUAL_FLOOR = 400_000_000_000n;
export const BASE_VIRTUAL_CEILING = 49_000_000_000_000_000n;
export const QUOTE_VIRTUAL_CEILING = 1_400_000_000_000n;
export const POOL_FEE_RATE_BPS = 25;
export const MARKET_REGISTRATION_FEE = 100_000_000n;

// For APT coin and for each emojicoin.
export const DECIMALS = 8;

// Emoji sequence length constraints.
export const MAX_CHAT_MESSAGE_LENGTH = 100;
export const MAX_SYMBOL_LENGTH = 10;

export enum CandlestickResolution {
  PERIOD_1M = 60000000,
  PERIOD_5M = 300000000,
  PERIOD_15M = 900000000,
  PERIOD_30M = 1800000000,
  PERIOD_1H = 3600000000,
  PERIOD_4H = 14400000000,
  PERIOD_1D = 86400000000,
}

export const ResolutionToPeriod: Record<CandlestickResolution, CandlestickResolution> = {
  [CandlestickResolution.PERIOD_1M]: CandlestickResolution.PERIOD_1M,
  [CandlestickResolution.PERIOD_5M]: CandlestickResolution.PERIOD_5M,
  [CandlestickResolution.PERIOD_15M]: CandlestickResolution.PERIOD_15M,
  [CandlestickResolution.PERIOD_30M]: CandlestickResolution.PERIOD_30M,
  [CandlestickResolution.PERIOD_1H]: CandlestickResolution.PERIOD_1H,
  [CandlestickResolution.PERIOD_4H]: CandlestickResolution.PERIOD_4H,
  [CandlestickResolution.PERIOD_1D]: CandlestickResolution.PERIOD_1D,
};

export const VALID_RESOLUTIONS = new Set(Object.values(CandlestickResolution));
