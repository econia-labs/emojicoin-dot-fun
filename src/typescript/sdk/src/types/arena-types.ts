import type { ArenaPeriod } from "../const";
import type { SymbolEmoji } from "../emoji_data";
import type { AccountAddressString } from "../emojicoin_dot_fun";
import type {
  ArenaCandlestickModel,
  ArenaEnterModel,
  ArenaEventModels,
  ArenaExitModel,
  ArenaMeleeModel,
  ArenaModelWithMeleeID,
  ArenaSwapModel,
  ArenaVaultBalanceUpdateModel,
  BrokerEventModels,
  // Note that if you import anything more than a type here, you'll get lots of import issues.
} from "../indexer-v2/types";
import { postgresTimestampToDate } from "../indexer-v2/types/json-types";
import { toAccountAddressString } from "../utils/account-address";
import { dateFromMicroseconds } from "../utils/misc";
import type { JsonTypes } from "./json-types";
import type { AnyNumberString, Types } from "./types";

export const ARENA_CANDLESTICK_NAME = "ArenaCandlestick";

type WithVersionAndEventIndex = {
  version: number | string;
  eventIndex: number;
};

export type ArenaTypes = {
  ArenaMeleeEvent: {
    meleeID: bigint;
    emojicoin0MarketAddress: AccountAddressString;
    emojicoin1MarketAddress: AccountAddressString;
    startTime: Date;
    duration: bigint;
    maxMatchPercentage: bigint;
    maxMatchAmount: bigint;
    availableRewards: bigint;
    eventName: "ArenaMelee";
  } & WithVersionAndEventIndex;

  ArenaEnterEvent: {
    user: AccountAddressString;
    meleeID: bigint;
    inputAmount: bigint;
    quoteVolume: bigint;
    integratorFee: bigint;
    matchAmount: bigint;
    emojicoin0Proceeds: bigint;
    emojicoin1Proceeds: bigint;
    emojicoin0ExchangeRateBase: bigint;
    emojicoin0ExchangeRateQuote: bigint;
    emojicoin1ExchangeRateBase: bigint;
    emojicoin1ExchangeRateQuote: bigint;
    eventName: "ArenaEnter";
  } & WithVersionAndEventIndex;

  ArenaExitEvent: {
    user: AccountAddressString;
    meleeID: bigint;
    tapOutFee: bigint;
    emojicoin0Proceeds: bigint;
    emojicoin1Proceeds: bigint;
    aptProceeds: bigint;
    emojicoin0ExchangeRateBase: bigint;
    emojicoin0ExchangeRateQuote: bigint;
    emojicoin1ExchangeRateBase: bigint;
    emojicoin1ExchangeRateQuote: bigint;
    duringMelee: boolean;
    eventName: "ArenaExit";
  } & WithVersionAndEventIndex;

  ArenaSwapEvent: {
    user: AccountAddressString;
    meleeID: bigint;
    quoteVolume: bigint;
    integratorFee: bigint;
    emojicoin0Proceeds: bigint;
    emojicoin1Proceeds: bigint;
    emojicoin0ExchangeRateBase: bigint;
    emojicoin0ExchangeRateQuote: bigint;
    emojicoin1ExchangeRateBase: bigint;
    emojicoin1ExchangeRateQuote: bigint;
    duringMelee: boolean;
    eventName: "ArenaSwap";
  } & WithVersionAndEventIndex;

  ArenaVaultBalanceUpdateEvent: {
    newBalance: bigint;
    eventName: "ArenaVaultBalanceUpdate";
  } & WithVersionAndEventIndex;

  ArenaPosition: {
    user: AccountAddressString;
    version: bigint;
    meleeID: bigint;
    open: boolean;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    withdrawals: bigint;
    deposits: bigint;
    lastExit0: boolean | null;
    matchAmount: bigint;
  };

  ArenaLeaderboardHistory: {
    user: AccountAddressString;
    version: bigint;
    meleeID: bigint;
    profits: bigint;
    losses: bigint;
    lastExit0: boolean | null;
    exited: boolean;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    withdrawals: bigint;
  };

  ArenaLeaderboardHistoryWithArenaInfo: {
    user: AccountAddressString;
    meleeID: bigint;
    profits: bigint;
    losses: bigint;
    withdrawals: bigint;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    lastExit0: boolean | null;
    exited: boolean;

    emojicoin0MarketAddress: AccountAddressString;
    emojicoin0Symbols: SymbolEmoji[];
    emojicoin0MarketID: bigint;
    emojicoin1MarketAddress: AccountAddressString;
    emojicoin1Symbols: SymbolEmoji[];
    emojicoin1MarketID: bigint;
    startTime: Date;
    duration: bigint;

    arenaInfoLastTransactionVersion: bigint;
    leaderboardHistoryLastTransactionVersion: bigint;
  };

  ArenaLeaderboard: {
    user: AccountAddressString;
    version: bigint;
    open: boolean;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    profits: bigint;
    losses: bigint;
    pnlPercent: number;
    pnlOctas: number;
    withdrawals: bigint;
  };

  ArenaInfo: {
    meleeID: bigint;
    version: bigint;
    volume: bigint;
    rewardsRemaining: bigint;
    emojicoin0Locked: bigint;
    emojicoin1Locked: bigint;
    emojicoin0MarketAddress: AccountAddressString;
    emojicoin0Symbols: SymbolEmoji[];
    emojicoin0MarketID: bigint;
    emojicoin1MarketAddress: AccountAddressString;
    emojicoin1Symbols: SymbolEmoji[];
    emojicoin1MarketID: bigint;
    startTime: Date;
    duration: bigint;
    maxMatchPercentage: bigint;
    maxMatchAmount: bigint;
  };

  ArenaCandlestick: {
    meleeID: bigint;
    version: bigint;
    period: ArenaPeriod;
    startTime: Date;
    openPrice: number;
    closePrice: number;
    highPrice: number;
    lowPrice: number;
    volume: bigint;
    nSwaps: bigint;
  };

  EscrowResource: {
    meleeID: bigint;
    matchAmount: bigint;
    emojicoin0: bigint;
    emojicoin1: bigint;
  };
};

const toExchangeRate = (data: JsonTypes["BothEmojicoinExchangeRates"]) => ({
  emojicoin0ExchangeRateBase: BigInt(data.emojicoin_0_exchange_rate.base),
  emojicoin0ExchangeRateQuote: BigInt(data.emojicoin_0_exchange_rate.quote),
  emojicoin1ExchangeRateBase: BigInt(data.emojicoin_1_exchange_rate.base),
  emojicoin1ExchangeRateQuote: BigInt(data.emojicoin_1_exchange_rate.quote),
});

const withVersionAndEventIndex = (data: {
  version: AnyNumberString;
  eventIndex: AnyNumberString;
}) => ({
  version: Number(data.version),
  eventIndex: Number(data.eventIndex),
});

/**
 * Regex test for a valid bigint string.
 *
 * Only succeeds if every character in a string is a number 0-9.
 *
 * Accepts leading zeroes.
 */
const isValidBigIntString = (str: string) => /^\d+$/.test(str);

/**
 * Since we've coalesced the types for the database and emitted module event data, it's helpful
 * to have a function that can handle either an incoming bigint string or a postgres timestamp.
 *
 * NOTE: This function returns `new Date(0)` if all attempts at parsing fail. Explanation below.
 */
export const safeParseBigIntOrPostgresTimestamp = (anyInput: AnyNumberString) => {
  const input = anyInput.toString();
  if (isValidBigIntString(input)) {
    const bigInput = BigInt(input);
    return dateFromMicroseconds(bigInput);
  }
  try {
    return postgresTimestampToDate(input);
  } catch {
    // If all else fails, return a null-like date. Generally, parsing these dates isn't a set of
    // critical functions, so it's okay if the data is slightly invalid. Ensuring the parsing
    // functions don't fail is more important than the validity of timestamp data.
    return new Date(0);
  }
};

export const toArenaMeleeEvent = (
  data: JsonTypes["ArenaMeleeEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  meleeID: BigInt(data.melee_id),
  emojicoin0MarketAddress: toAccountAddressString(data.emojicoin_0_market_address),
  emojicoin1MarketAddress: toAccountAddressString(data.emojicoin_1_market_address),
  startTime: safeParseBigIntOrPostgresTimestamp(data.start_time),
  duration: BigInt(data.duration),
  maxMatchPercentage: BigInt(data.max_match_percentage),
  maxMatchAmount: BigInt(data.max_match_amount),
  availableRewards: BigInt(data.available_rewards),
  eventName: "ArenaMelee" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaEnterEvent = (
  data: JsonTypes["ArenaEnterEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  inputAmount: BigInt(data.input_amount),
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  matchAmount: BigInt(data.match_amount),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  ...toExchangeRate(data),
  eventName: "ArenaEnter" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaExitEvent = (
  data: JsonTypes["ArenaExitEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  tapOutFee: BigInt(data.tap_out_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  aptProceeds:
    (BigInt(data.emojicoin_0_proceeds) * BigInt(data.emojicoin_0_exchange_rate.quote)) /
      BigInt(data.emojicoin_0_exchange_rate.base) +
    (BigInt(data.emojicoin_1_proceeds) * BigInt(data.emojicoin_1_exchange_rate.quote)) /
      BigInt(data.emojicoin_1_exchange_rate.base),
  ...toExchangeRate(data),
  eventName: "ArenaExit" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
  duringMelee: true,
});

export const toArenaSwapEvent = (
  data: JsonTypes["ArenaSwapEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  ...toExchangeRate(data),
  eventName: "ArenaSwap" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
  duringMelee: true,
});

export const toArenaVaultBalanceUpdateEvent = (
  data: JsonTypes["ArenaVaultBalanceUpdateEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  newBalance: BigInt(data.new_balance),
  eventName: "ArenaVaultBalanceUpdate" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaRegistry = (data: JsonTypes["ArenaRegistry"]) => ({
  numMelees: BigInt(data.n_melees),
  /**
   * Note that the number of melees is also the exact meleeID of the current melee.
   */
  currentMeleeID: BigInt(data.n_melees),
  vaultAddress: toAccountAddressString(data.vault_address),
  vaultBalance: BigInt(data.vault_address),
  nextMeleeDuration: BigInt(data.next_melee_duration),
  nextMeleeAvailableRewards: BigInt(data.next_melee_available_rewards),
  nextMeleeMaxMatchPercentage: BigInt(data.next_melee_max_match_percentage),
  nextMeleeMaxMatchAmount: BigInt(data.next_melee_max_match_amount),
});

export const toEscrowResource = ({ data }: JsonTypes["Escrow"]) => ({
  meleeID: BigInt(data.melee_id),
  matchAmount: BigInt(data.match_amount),
  emojicoin0: BigInt(data.emojicoin_0.value),
  emojicoin1: BigInt(data.emojicoin_1.value),
});

export type AnyArenaEvent =
  | Types["ArenaEnterEvent"]
  | Types["ArenaExitEvent"]
  | Types["ArenaMeleeEvent"]
  | Types["ArenaSwapEvent"]
  | Types["ArenaVaultBalanceUpdateEvent"];

/* eslint-disable import/no-unused-modules */

export const isArenaEnterEvent = (e: AnyArenaEvent): e is Types["ArenaEnterEvent"] =>
  e.eventName === "ArenaEnter";

export const isArenaExitEvent = (e: AnyArenaEvent): e is Types["ArenaExitEvent"] =>
  e.eventName === "ArenaExit";

export const isArenaMeleeEvent = (e: AnyArenaEvent): e is Types["ArenaMeleeEvent"] =>
  e.eventName === "ArenaMelee";

export const isArenaSwapEvent = (e: AnyArenaEvent): e is Types["ArenaSwapEvent"] =>
  e.eventName === "ArenaSwap";

export const isArenaVaultBalanceUpdateEvent = (
  e: AnyArenaEvent
): e is Types["ArenaVaultBalanceUpdateEvent"] => e.eventName === "ArenaVaultBalanceUpdate";

export const isArenaEnterModel = (e: BrokerEventModels): e is ArenaEnterModel =>
  e.eventName === "ArenaEnter";

export const isArenaExitModel = (e: BrokerEventModels): e is ArenaExitModel =>
  e.eventName === "ArenaExit";

export const isArenaMeleeModel = (e: BrokerEventModels): e is ArenaMeleeModel =>
  e.eventName === "ArenaMelee";

export const isArenaSwapModel = (e: BrokerEventModels): e is ArenaSwapModel =>
  e.eventName === "ArenaSwap";

export const isArenaCandlestickModel = (e: BrokerEventModels): e is ArenaCandlestickModel =>
  e.eventName === ARENA_CANDLESTICK_NAME;

export const isArenaVaultBalanceUpdateModel = (
  e: BrokerEventModels
): e is ArenaVaultBalanceUpdateModel => e.eventName === "ArenaVaultBalanceUpdate";

export const isArenaModelWithMeleeID = (e: BrokerEventModels): e is ArenaModelWithMeleeID =>
  isArenaEnterModel(e) ||
  isArenaExitModel(e) ||
  isArenaMeleeModel(e) ||
  isArenaSwapModel(e) ||
  isArenaCandlestickModel(e);

export const isArenaEventModel = (e: BrokerEventModels): e is ArenaEventModels =>
  isArenaModelWithMeleeID(e) || isArenaVaultBalanceUpdateModel(e);

/* eslint-enable import/no-unused-modules */
