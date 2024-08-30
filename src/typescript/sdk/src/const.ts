import { AccountAddress, APTOS_COIN, parseTypeTag } from "@aptos-labs/ts-sdk";
import Big from "big.js";
import { type ValueOf } from "./utils/utility-types";

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
export const LOCAL_INDEXER_URL = process.env.INDEXER_URL ?? "http://localhost:3000";
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

/// As defined in the database, aka the enum string.
export enum Period {
  Period1M = "period_1m",
  Period5M = "period_5m",
  Period15M = "period_15m",
  Period30M = "period_30m",
  Period1H = "period_1h",
  Period4H = "period_4h",
  Period1D = "period_1d",
}

/// As defined in the database, aka the enum string.
export enum Trigger {
  PackagePublication = "package_publication",
  MarketRegistration = "market_registration",
  SwapBuy = "swap_buy",
  SwapSell = "swap_sell",
  ProvideLiquidity = "provide_liquidity",
  RemoveLiquidity = "remove_liquidity",
  Chat = "chat",
}

export const toPeriod = (s: string) =>
  ({
    period_1m: Period.Period1M,
    period_5m: Period.Period5M,
    period_15m: Period.Period15M,
    period_30m: Period.Period30M,
    period_1h: Period.Period1H,
    period_4h: Period.Period4H,
    period_1d: Period.Period1D,
  })[s as ValueOf<typeof Period>] ??
  (() => {
    throw new Error(`Unknown period: ${s}`);
  })();

export const toTrigger = (s: string) =>
  ({
    package_publication: Trigger.PackagePublication,
    market_registration: Trigger.MarketRegistration,
    swap_buy: Trigger.SwapBuy,
    swap_sell: Trigger.SwapSell,
    provide_liquidity: Trigger.ProvideLiquidity,
    remove_liquidity: Trigger.RemoveLiquidity,
    chat: Trigger.Chat,
  })[s as ValueOf<typeof Trigger>] ??
  (() => {
    throw new Error(`Unknown trigger: ${s}`);
  })();

/// As defined in the contract, not in the database; i.e., numbers, not enum strings.
export enum TriggerFromContract {
  PackagePublication = 0,
  MarketRegistration = 1,
  SwapBuy = 2,
  SwapSell = 3,
  ProvideLiquidity = 4,
  RemoveLiquidity = 5,
  Chat = 6,
}

/**
 * Note that a period boundary, a candlestick resolution, a period, and a candlestick time frame
 * are all referred to interchangeably throughout this codebase.
 */
export enum PeriodDuration {
  PERIOD_1M = 60000000,
  PERIOD_5M = 300000000,
  PERIOD_15M = 900000000,
  PERIOD_30M = 1800000000,
  PERIOD_1H = 3600000000,
  PERIOD_4H = 14400000000,
  PERIOD_1D = 86400000000,
}

export const periodEnumToPeriodDuration = (period: Period): PeriodDuration => {
  if (period === Period.Period1M) return PeriodDuration.PERIOD_1M;
  if (period === Period.Period5M) return PeriodDuration.PERIOD_5M;
  if (period === Period.Period15M) return PeriodDuration.PERIOD_15M;
  if (period === Period.Period30M) return PeriodDuration.PERIOD_30M;
  if (period === Period.Period1H) return PeriodDuration.PERIOD_1H;
  if (period === Period.Period4H) return PeriodDuration.PERIOD_4H;
  if (period === Period.Period1D) return PeriodDuration.PERIOD_1D;
  throw new Error(`Invalid period: ${period}`);
};

export const fromContractEnumToRawTrigger = (trigger: Trigger): number => {
  if (trigger === Trigger.PackagePublication) return TriggerFromContract.PackagePublication;
  if (trigger === Trigger.MarketRegistration) return TriggerFromContract.MarketRegistration;
  if (trigger === Trigger.SwapBuy) return TriggerFromContract.SwapBuy;
  if (trigger === Trigger.SwapSell) return TriggerFromContract.SwapSell;
  if (trigger === Trigger.ProvideLiquidity) return TriggerFromContract.ProvideLiquidity;
  if (trigger === Trigger.RemoveLiquidity) return TriggerFromContract.RemoveLiquidity;
  if (trigger === Trigger.Chat) return TriggerFromContract.Chat;
  throw new Error(`Invalid state trigger: ${trigger}`);
};

export const fromRawTriggerToContractEnum = (num: number): Trigger => {
  if (num === TriggerFromContract.PackagePublication) return Trigger.PackagePublication;
  if (num === TriggerFromContract.MarketRegistration) return Trigger.MarketRegistration;
  if (num === TriggerFromContract.SwapBuy) return Trigger.SwapBuy;
  if (num === TriggerFromContract.SwapSell) return Trigger.SwapSell;
  if (num === TriggerFromContract.ProvideLiquidity) return Trigger.ProvideLiquidity;
  if (num === TriggerFromContract.RemoveLiquidity) return Trigger.RemoveLiquidity;
  if (num === TriggerFromContract.Chat) return Trigger.Chat;
  throw new Error(`Invalid state trigger: ${num}`);
};

export const toPeriodFromContract = (num: bigint): Period => {
  if (num === BigInt(PeriodDuration.PERIOD_1M)) return Period.Period1M;
  if (num === BigInt(PeriodDuration.PERIOD_5M)) return Period.Period5M;
  if (num === BigInt(PeriodDuration.PERIOD_15M)) return Period.Period15M;
  if (num === BigInt(PeriodDuration.PERIOD_30M)) return Period.Period30M;
  if (num === BigInt(PeriodDuration.PERIOD_1H)) return Period.Period1H;
  if (num === BigInt(PeriodDuration.PERIOD_4H)) return Period.Period4H;
  if (num === BigInt(PeriodDuration.PERIOD_1D)) return Period.Period1D;
  throw new Error(`Invalid period: ${num}`);
};

// For APT coin and for each emojicoin.
export const DECIMALS = 8;

// The number of decimals at which exponential notation is used for positive Big.js numbers.
export const NUM_DECIMALS_BEFORE_SCIENTIFIC_NOTATION = 1000;
Big.PE = NUM_DECIMALS_BEFORE_SCIENTIFIC_NOTATION;

// Emoji sequence length constraints.
export const MAX_NUM_CHAT_EMOJIS = 100;
export const MAX_SYMBOL_LENGTH = 10;

// The default grace period time for a new market registrant to trade on a new market before
// non-registrants can trade. Note that this period is ended early once the registrant makes a
// single trade.
export const GRACE_PERIOD_TIME = BigInt(PeriodDuration.PERIOD_5M.valueOf());

/**
 * A helper object to convert from an untyped number to a PeriodDuration enum value.
 * If the number is invalid, the value returned will be undefined.
 */
export const toPeriodDuration = (num: number | bigint): PeriodDuration => {
  if (Number(num) === PeriodDuration.PERIOD_1M) return PeriodDuration.PERIOD_1M;
  if (Number(num) === PeriodDuration.PERIOD_5M) return PeriodDuration.PERIOD_5M;
  if (Number(num) === PeriodDuration.PERIOD_15M) return PeriodDuration.PERIOD_15M;
  if (Number(num) === PeriodDuration.PERIOD_30M) return PeriodDuration.PERIOD_30M;
  if (Number(num) === PeriodDuration.PERIOD_1H) return PeriodDuration.PERIOD_1H;
  if (Number(num) === PeriodDuration.PERIOD_4H) return PeriodDuration.PERIOD_4H;
  if (Number(num) === PeriodDuration.PERIOD_1D) return PeriodDuration.PERIOD_1D;
  throw new Error(`Invalid candlestick period duration: ${num}`);
};

export const PERIOD_DURATIONS = [
  PeriodDuration.PERIOD_1M,
  PeriodDuration.PERIOD_5M,
  PeriodDuration.PERIOD_15M,
  PeriodDuration.PERIOD_30M,
  PeriodDuration.PERIOD_1H,
  PeriodDuration.PERIOD_4H,
  PeriodDuration.PERIOD_1D,
];

export const toPeriodDurationKey = (period: PeriodDuration) => {
  switch (period) {
    case PeriodDuration.PERIOD_1M:
      return "PERIOD_1M";
    case PeriodDuration.PERIOD_5M:
      return "PERIOD_5M";
    case PeriodDuration.PERIOD_15M:
      return "PERIOD_15M";
    case PeriodDuration.PERIOD_30M:
      return "PERIOD_30M";
    case PeriodDuration.PERIOD_1H:
      return "PERIOD_1H";
    case PeriodDuration.PERIOD_4H:
      return "PERIOD_4H";
    case PeriodDuration.PERIOD_1D:
      return "PERIOD_1D";
    default:
      throw new Error(`Unknown period: ${period}`);
  }
};
