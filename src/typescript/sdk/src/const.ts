import { AccountAddress, APTOS_COIN, parseTypeTag } from "@aptos-labs/ts-sdk";
import Big from "big.js";

export const VERCEL = process.env.VERCEL === "1";
if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS || !process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS) {
  let missing = "";
  let missingBoth = false;
  if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS) {
    missing += "NEXT_PUBLIC_MODULE_ADDRESS";
  }
  if (!process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS) {
    if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS) {
      missingBoth = true;
      missing += " and NEXT_PUBLIC_REWARDS_MODULE_ADDRESS";
    } else {
      missing += "NEXT_PUBLIC_REWARDS_MODULE_ADDRESS";
    }
  }
  missing = missing.trimEnd();
  const missingMessage = `Missing ${missing} environment variable${missingBoth ? "s" : ""}`;
  let fullErrorMessage = `\n\n${"-".repeat(61)}\n\n${missingMessage}\n`;
  if (!VERCEL) {
    fullErrorMessage += "Please run this project from the top-level, parent directory.\n";
  }
  fullErrorMessage += `\n${"-".repeat(61)}\n`;
  throw new Error(fullErrorMessage);
}
if (typeof window !== "undefined" && typeof process.env.INBOX_URL !== "undefined") {
  throw new Error("The `inbox` endpoint should not be exposed to any client components.");
}
export const MODULE_ADDRESS = (() => AccountAddress.from(process.env.NEXT_PUBLIC_MODULE_ADDRESS))();
export const REWARDS_MODULE_ADDRESS = (() =>
  AccountAddress.from(process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS))();

export const LOCAL_INBOX_URL = process.env.INBOX_URL ?? "http://localhost:3000";
export const LOCAL_INDEXER_URL = process.env.INBOX_URL ?? "http://localhost:3000";
export const ONE_APT = 1 * 10 ** 8;
export const ONE_APT_BIGINT = BigInt(ONE_APT);
export const APTOS_COIN_TYPE_TAG = parseTypeTag(APTOS_COIN);
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
export const REWARDS_MODULE_NAME = "emojicoin_dot_fun_rewards";
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
// 1 APT plus the 4 APT deposit.
export const APT_BALANCE_REQUIRED_TO_REGISTER_MARKET = 5n * ONE_APT_BIGINT;

export enum StateTrigger {
  PACKAGE_PUBLICATION = 0,
  MARKET_REGISTRATION = 1,
  SWAP_BUY = 2,
  SWAP_SELL = 3,
  PROVIDE_LIQUIDITY = 4,
  REMOVE_LIQUIDITY = 5,
  CHAT = 6,
}

export const toStateTrigger = (num: number): StateTrigger => {
  if (num === StateTrigger.PACKAGE_PUBLICATION) return StateTrigger.PACKAGE_PUBLICATION;
  if (num === StateTrigger.MARKET_REGISTRATION) return StateTrigger.MARKET_REGISTRATION;
  if (num === StateTrigger.SWAP_BUY) return StateTrigger.SWAP_BUY;
  if (num === StateTrigger.SWAP_SELL) return StateTrigger.SWAP_SELL;
  if (num === StateTrigger.PROVIDE_LIQUIDITY) return StateTrigger.PROVIDE_LIQUIDITY;
  if (num === StateTrigger.REMOVE_LIQUIDITY) return StateTrigger.REMOVE_LIQUIDITY;
  if (num === StateTrigger.CHAT) return StateTrigger.CHAT;
  throw new Error(`Invalid state trigger: ${num}`);
};

// For APT coin and for each emojicoin.
export const DECIMALS = 8;

// The number of decimals at which exponential notation is used for positive Big.js numbers.
export const NUM_DECIMALS_BEFORE_SCIENTIFIC_NOTATION = 1000;
Big.PE = NUM_DECIMALS_BEFORE_SCIENTIFIC_NOTATION;

// Emoji sequence length constraints.
export const MAX_NUM_CHAT_EMOJIS = 100;
export const MAX_SYMBOL_LENGTH = 10;

/**
 * Note that a period boundary, a candlestick resolution, a period, and a candlestick time frame
 * are all referred to interchangeably throughout this codebase.
 */
export enum CandlestickResolution {
  PERIOD_1M = 60000000,
  PERIOD_5M = 300000000,
  PERIOD_15M = 900000000,
  PERIOD_30M = 1800000000,
  PERIOD_1H = 3600000000,
  PERIOD_4H = 14400000000,
  PERIOD_1D = 86400000000,
}

// The default grace period time for a new market registrant to trade on a new market before
// non-registrants can trade. Note that this period is ended early once the registrant makes a
// single trade.
export const GRACE_PERIOD_TIME = BigInt(CandlestickResolution.PERIOD_5M.valueOf());

/**
 * A helper object to convert from an untyped number to a CandlestickResolution enum value.
 * If the number is invalid, the value returned will be undefined.
 */
export const toCandlestickResolution = (num: number | bigint): CandlestickResolution => {
  if (Number(num) === CandlestickResolution.PERIOD_1M) return CandlestickResolution.PERIOD_1M;
  if (Number(num) === CandlestickResolution.PERIOD_5M) return CandlestickResolution.PERIOD_5M;
  if (Number(num) === CandlestickResolution.PERIOD_15M) return CandlestickResolution.PERIOD_15M;
  if (Number(num) === CandlestickResolution.PERIOD_30M) return CandlestickResolution.PERIOD_30M;
  if (Number(num) === CandlestickResolution.PERIOD_1H) return CandlestickResolution.PERIOD_1H;
  if (Number(num) === CandlestickResolution.PERIOD_4H) return CandlestickResolution.PERIOD_4H;
  if (Number(num) === CandlestickResolution.PERIOD_1D) return CandlestickResolution.PERIOD_1D;
  throw new Error(`Invalid candlestick resolution: ${num}`);
};

export const RESOLUTIONS_ARRAY = [
  CandlestickResolution.PERIOD_1M,
  CandlestickResolution.PERIOD_5M,
  CandlestickResolution.PERIOD_15M,
  CandlestickResolution.PERIOD_30M,
  CandlestickResolution.PERIOD_1H,
  CandlestickResolution.PERIOD_4H,
  CandlestickResolution.PERIOD_1D,
];

export const toResolutionKey = (resolution: CandlestickResolution) => {
  switch (resolution) {
    case CandlestickResolution.PERIOD_1M:
      return "PERIOD_1M";
    case CandlestickResolution.PERIOD_5M:
      return "PERIOD_5M";
    case CandlestickResolution.PERIOD_15M:
      return "PERIOD_15M";
    case CandlestickResolution.PERIOD_30M:
      return "PERIOD_30M";
    case CandlestickResolution.PERIOD_1H:
      return "PERIOD_1H";
    case CandlestickResolution.PERIOD_4H:
      return "PERIOD_4H";
    case CandlestickResolution.PERIOD_1D:
      return "PERIOD_1D";
    default:
      throw new Error(`Unknown resolution: ${resolution}`);
  }
};
