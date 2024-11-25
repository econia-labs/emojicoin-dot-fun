import {
  AccountAddress,
  APTOS_COIN,
  Network,
  NetworkToNetworkName,
  parseTypeTag,
} from "@aptos-labs/ts-sdk";
import Big from "big.js";
import { type ValueOf } from "./utils/utility-types";
import { type DatabaseStructType } from "./indexer-v2/types/json-types";
import { Types } from "./types";

export const VERCEL = process.env.VERCEL === "1";
if (
  !process.env.NEXT_PUBLIC_MODULE_ADDRESS ||
  !process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS ||
  !process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS ||
  !process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS ||
  !process.env.NEXT_PUBLIC_APTOS_NETWORK
) {
  const missing = [
    ["NEXT_PUBLIC_MODULE_ADDRESS", process.env.NEXT_PUBLIC_MODULE_ADDRESS],
    ["NEXT_PUBLIC_REWARDS_MODULE_ADDRESS", process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS],
    ["NEXT_PUBLIC_INTEGRATOR_ADDRESS", process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS],
    ["NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS", process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS],
    ["NEXT_PUBLIC_APTOS_NETWORK", process.env.NEXT_PUBLIC_APTOS_NETWORK],
  ].filter(([_, value]) => !value);
  missing.forEach(([key, _]) => {
    console.error(`Missing environment variables ${key}`);
  });
  throw new Error(
    VERCEL
      ? `Please set the missing environment variables. ${missing.map(([key, _]) => key).join(", ")}`
      : "Please run this project from the top-level, parent directory.\n"
  );
}

const network = process.env.NEXT_PUBLIC_APTOS_NETWORK;
export const APTOS_NETWORK = NetworkToNetworkName[network];
if (!APTOS_NETWORK) {
  throw new Error(`Invalid network: ${network}`);
}

const clientKeys: Record<Network, string | undefined> = {
  [Network.LOCAL]: process.env.NEXT_PUBLIC_LOCAL_APTOS_API_KEY,
  [Network.CUSTOM]: process.env.NEXT_PUBLIC_CUSTOM_APTOS_API_KEY,
  [Network.DEVNET]: process.env.NEXT_PUBLIC_DEVNET_APTOS_API_KEY,
  [Network.TESTNET]: process.env.NEXT_PUBLIC_TESTNET_APTOS_API_KEY,
  [Network.MAINNET]: process.env.NEXT_PUBLIC_MAINNET_APTOS_API_KEY,
};

const serverKeys: Record<Network, string | undefined> = {
  [Network.LOCAL]: process.env.SERVER_LOCAL_APTOS_API_KEY,
  [Network.CUSTOM]: process.env.SERVER_CUSTOM_APTOS_API_KEY,
  [Network.DEVNET]: process.env.SERVER_DEVNET_APTOS_API_KEY,
  [Network.TESTNET]: process.env.SERVER_TESTNET_APTOS_API_KEY,
  [Network.MAINNET]: process.env.SERVER_MAINNET_APTOS_API_KEY,
};

const clientApiKey = clientKeys[APTOS_NETWORK];
const serverApiKey = serverKeys[APTOS_NETWORK];

export const getAptosApiKey = () => serverApiKey ?? clientApiKey;

// Select the API key from the list of env API keys. This means we don't have to change the env
// var for API keys when changing environments- we just need to provide them all every time, which
// is much simpler.
export const MODULE_ADDRESS = (() => AccountAddress.from(process.env.NEXT_PUBLIC_MODULE_ADDRESS))();
export const REWARDS_MODULE_ADDRESS = (() =>
  AccountAddress.from(process.env.NEXT_PUBLIC_REWARDS_MODULE_ADDRESS))();
export const INTEGRATOR_ADDRESS = (() =>
  AccountAddress.from(process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS))();
export const INTEGRATOR_FEE_RATE_BPS = Number(process.env.NEXT_PUBLIC_INTEGRATOR_FEE_RATE_BPS);
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
export const MARKET_CAP = 450_000_000_000n;
export const EMOJICOIN_REMAINDER = 1_000_000_000_000_000n;
export const EMOJICOIN_SUPPLY = 4_500_000_000_000_000n;
export const LP_TOKENS_INITIAL = 10_000_000_000_000n;
export const BASE_REAL_FLOOR = 0n;
export const QUOTE_REAL_FLOOR = 0n;
export const BASE_REAL_CEILING = 3_500_000_000_000_000n;
export const QUOTE_REAL_CEILING = 100_000_000_000n;
export const BASE_VIRTUAL_FLOOR = 1_400_000_000_000_000n;
export const QUOTE_VIRTUAL_FLOOR = 40_000_000_000n;
export const BASE_VIRTUAL_CEILING = 4_900_000_000_000_000n;
export const QUOTE_VIRTUAL_CEILING = 140_000_000_000n;
export const POOL_FEE_RATE_BPS = 25;
export const MARKET_REGISTRATION_FEE = ONE_APT_BIGINT;
export const MARKET_REGISTRATION_DEPOSIT = 1n * ONE_APT_BIGINT;
export const MARKET_REGISTRATION_GAS_ESTIMATION_NOT_FIRST = ONE_APT * 0.005;
export const MARKET_REGISTRATION_GAS_ESTIMATION_FIRST = ONE_APT * 0.6;
export const BASIS_POINTS_PER_UNIT = 10_000n;
/**
 * A market's virtual reserves upon creation. Used to calculate the swap price
 * of a market when no swaps exist yet.
 * 
 * @see {@link https://github.com/econia-labs/emojicoin-dot-fun/blob/295cf611950f66651452baa3e6ad6d6aef583f9b/src/move/emojicoin_dot_fun/sources/emojicoin_dot_fun.move#L2030}
 */
export const INITIAL_VIRTUAL_RESERVES: Types["Reserves"] = {
  base: BASE_VIRTUAL_CEILING,
  quote: QUOTE_VIRTUAL_FLOOR,
}

/**
 * A market's real reserves upon creation.
 * 
 * @see {@link INITIAL_VIRTUAL_RESERVES}
 */
export const INITIAL_REAL_RESERVES: Types["Reserves"] = {
  base: 0n,
  quote: 0n,
}

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

export const toPeriod = (s: DatabaseStructType["PeriodicStateMetadata"]["period"]) =>
  ({
    // From the database.
    period_1m: Period.Period1M,
    period_5m: Period.Period5M,
    period_15m: Period.Period15M,
    period_30m: Period.Period30M,
    period_1h: Period.Period1H,
    period_4h: Period.Period4H,
    period_1d: Period.Period1D,
    // From the broker.
    OneMinute: Period.Period1M,
    FiveMinutes: Period.Period5M,
    FifteenMinutes: Period.Period15M,
    ThirtyMinutes: Period.Period30M,
    OneHour: Period.Period1H,
    FourHours: Period.Period4H,
    OneDay: Period.Period1D,
  })[s as ValueOf<typeof Period>] ??
  (() => {
    throw new Error(`Unknown period: ${s}`);
  })();

export const toTrigger = (s: DatabaseStructType["GlobalStateEventData"]["trigger"]) =>
  ({
    // From the database.
    package_publication: Trigger.PackagePublication,
    market_registration: Trigger.MarketRegistration,
    swap_buy: Trigger.SwapBuy,
    swap_sell: Trigger.SwapSell,
    provide_liquidity: Trigger.ProvideLiquidity,
    remove_liquidity: Trigger.RemoveLiquidity,
    chat: Trigger.Chat,
    // From the broker.
    PackagePublication: Trigger.PackagePublication,
    MarketRegistration: Trigger.MarketRegistration,
    SwapBuy: Trigger.SwapBuy,
    SwapSell: Trigger.SwapSell,
    ProvideLiquidity: Trigger.ProvideLiquidity,
    RemoveLiquidity: Trigger.RemoveLiquidity,
    Chat: Trigger.Chat,
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

export const periodEnumToRawDuration = (period: Period): PeriodDuration => {
  if (period === Period.Period1M) return PeriodDuration.PERIOD_1M;
  if (period === Period.Period5M) return PeriodDuration.PERIOD_5M;
  if (period === Period.Period15M) return PeriodDuration.PERIOD_15M;
  if (period === Period.Period30M) return PeriodDuration.PERIOD_30M;
  if (period === Period.Period1H) return PeriodDuration.PERIOD_1H;
  if (period === Period.Period4H) return PeriodDuration.PERIOD_4H;
  if (period === Period.Period1D) return PeriodDuration.PERIOD_1D;
  throw new Error(`Invalid period: ${period}`);
};

export const triggerEnumToRawTrigger = (trigger: Trigger): number => {
  if (trigger === Trigger.PackagePublication) return TriggerFromContract.PackagePublication;
  if (trigger === Trigger.MarketRegistration) return TriggerFromContract.MarketRegistration;
  if (trigger === Trigger.SwapBuy) return TriggerFromContract.SwapBuy;
  if (trigger === Trigger.SwapSell) return TriggerFromContract.SwapSell;
  if (trigger === Trigger.ProvideLiquidity) return TriggerFromContract.ProvideLiquidity;
  if (trigger === Trigger.RemoveLiquidity) return TriggerFromContract.RemoveLiquidity;
  if (trigger === Trigger.Chat) return TriggerFromContract.Chat;
  throw new Error(`Invalid state trigger: ${trigger}`);
};

export const rawTriggerToEnum = (num: number): Trigger => {
  if (num === TriggerFromContract.PackagePublication) return Trigger.PackagePublication;
  if (num === TriggerFromContract.MarketRegistration) return Trigger.MarketRegistration;
  if (num === TriggerFromContract.SwapBuy) return Trigger.SwapBuy;
  if (num === TriggerFromContract.SwapSell) return Trigger.SwapSell;
  if (num === TriggerFromContract.ProvideLiquidity) return Trigger.ProvideLiquidity;
  if (num === TriggerFromContract.RemoveLiquidity) return Trigger.RemoveLiquidity;
  if (num === TriggerFromContract.Chat) return Trigger.Chat;
  throw new Error(`Invalid state trigger: ${num}`);
};

export const rawPeriodToEnum = (num: bigint): Period => {
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

export const PERIODS = [
  Period.Period1M,
  Period.Period5M,
  Period.Period15M,
  Period.Period30M,
  Period.Period1H,
  Period.Period4H,
  Period.Period1D,
];

const PERIODS_STRINGS_SET = new Set(PERIODS.map(String));

export const isPeriod = (period: string): period is Period => PERIODS_STRINGS_SET.has(period);
