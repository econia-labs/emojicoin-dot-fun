import { type SymbolEmoji } from "../emoji_data";
import { type AccountAddressString } from "../emojicoin_dot_fun";
import {
  type BrokerModelTypes,
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaMeleeModel,
  type ArenaSwapModel,
  type ArenaVaultBalanceUpdateModel,
} from "../indexer-v2";
import { toAccountAddressString } from "../utils";
import type JsonTypes from "./json-types";
import { type AnyNumberString, type Types } from "./types";

type WithVersionAndEventIndex = {
  version: number | string;
  eventIndex: number;
};

export type ArenaTypes = {
  ArenaMeleeEvent: {
    meleeID: bigint;
    emojicoin0MarketAddress: AccountAddressString;
    emojicoin1MarketAddress: AccountAddressString;
    startTime: bigint;
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
    emojicoin0ExchangeRateBase: bigint;
    emojicoin0ExchangeRateQuote: bigint;
    emojicoin1ExchangeRateBase: bigint;
    emojicoin1ExchangeRateQuote: bigint;
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
    eventName: "ArenaSwap";
  } & WithVersionAndEventIndex;

  ArenaVaultBalanceUpdateEvent: {
    newBalance: bigint;
    eventName: "ArenaVaultBalanceUpdate";
  } & WithVersionAndEventIndex;

  ArenaPositions: {
    user: AccountAddressString;
    meleeID: bigint;
    open: boolean;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    withdrawals: bigint;
    deposits: bigint;
  };

  ArenaLeaderboardHistory: {
    user: AccountAddressString;
    meleeID: bigint;
    profits: bigint;
    losses: bigint;
  };

  ArenaLeaderboard: {
    user: AccountAddressString;
    open: boolean;
    emojicoin0Balance: bigint;
    emojicoin1Balance: bigint;
    profits: bigint;
    losses: bigint;
    pnlPercent: number;
    pnlOctas: number;
  };

  ArenaInfo: {
    meleeID: bigint;
    volume: bigint;
    rewardsRemaining: bigint;
    aptLocked: bigint;
    emojicoin0MarketAddress: AccountAddressString;
    emojicoin0Symbols: SymbolEmoji[];
    emojicoin0MarketID: bigint;
    emojicoin1MarketAddress: AccountAddressString;
    emojicoin1Symbols: SymbolEmoji[];
    emojicoin1MarketID: bigint;
    startTime: bigint;
    duration: bigint;
    maxMatchPercentage: bigint;
    maxMatchAmount: bigint;
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

export const toArenaMeleeEvent = (
  data: JsonTypes["ArenaMeleeEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
) => ({
  meleeID: BigInt(data.melee_id),
  emojicoin0MarketAddress: toAccountAddressString(data.emojicoin_0_market_address),
  emojicoin1MarketAddress: toAccountAddressString(data.emojicoin_1_market_address),
  startTime: BigInt(data.start_time),
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
  ...toExchangeRate(data),
  eventName: "ArenaExit" as const,
  ...withVersionAndEventIndex({ version, eventIndex }),
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

export type AnyArenaEvent =
  | Types["ArenaEnterEvent"]
  | Types["ArenaExitEvent"]
  | Types["ArenaMeleeEvent"]
  | Types["ArenaSwapEvent"]
  | Types["ArenaVaultBalanceUpdateEvent"];

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

export const isArenaEnterModel = (e: BrokerModelTypes): e is ArenaEnterModel =>
  e.eventName === "ArenaEnter";

export const isArenaExitModel = (e: BrokerModelTypes): e is ArenaExitModel =>
  e.eventName === "ArenaExit";

export const isArenaMeleeModel = (e: BrokerModelTypes): e is ArenaMeleeModel =>
  e.eventName === "ArenaMelee";

export const isArenaSwapModel = (e: BrokerModelTypes): e is ArenaSwapModel =>
  e.eventName === "ArenaSwap";

export const isArenaVaultBalanceUpdateModel = (
  e: BrokerModelTypes
): e is ArenaVaultBalanceUpdateModel => e.eventName === "ArenaVaultBalanceUpdate";
