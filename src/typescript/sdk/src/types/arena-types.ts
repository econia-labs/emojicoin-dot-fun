import { type SymbolEmoji } from "../emoji_data";
import { type AccountAddressString } from "../emojicoin_dot_fun";
import { toAccountAddressString } from "../utils";
import type JsonTypes from "./json-types";
import { type WithVersionAndGUID, type AnyNumberString, type Types } from "./types";

export type ArenaEventName =
  | "ArenaMelee"
  | "ArenaEnter"
  | "ArenaExit"
  | "ArenaSwap"
  | "ArenaVaultBalanceUpdate";

type WithVersionAndEventIndex = Omit<WithVersionAndGUID, "guid"> & {
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

const toExchangeRate = (data: JsonTypes["ArenaExchangeRate"]) => ({
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
): Types["ArenaMeleeEvent"] => ({
  meleeID: BigInt(data.melee_id),
  emojicoin0MarketAddress: toAccountAddressString(data.emojicoin_0_market_address),
  emojicoin1MarketAddress: toAccountAddressString(data.emojicoin_1_market_address),
  startTime: BigInt(data.start_time),
  duration: BigInt(data.duration),
  maxMatchPercentage: BigInt(data.max_match_percentage),
  maxMatchAmount: BigInt(data.max_match_amount),
  availableRewards: BigInt(data.available_rewards),
  eventName: "ArenaMelee",
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaEnterEvent = (
  data: JsonTypes["ArenaEnterEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
): Types["ArenaEnterEvent"] => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  inputAmount: BigInt(data.input_amount),
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  matchAmount: BigInt(data.match_amount),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  ...toExchangeRate(data),
  eventName: "ArenaEnter",
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaExitEvent = (
  data: JsonTypes["ArenaExitEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
): Types["ArenaExitEvent"] => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  tapOutFee: BigInt(data.tap_out_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  ...toExchangeRate(data),
  eventName: "ArenaExit",
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaSwapEvent = (
  data: JsonTypes["ArenaSwapEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
): Types["ArenaSwapEvent"] => ({
  user: toAccountAddressString(data.user),
  meleeID: BigInt(data.melee_id),
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  ...toExchangeRate(data),
  eventName: "ArenaSwap",
  ...withVersionAndEventIndex({ version, eventIndex }),
});

export const toArenaVaultBalanceUpdateEvent = (
  data: JsonTypes["ArenaVaultBalanceUpdateEvent"],
  version: AnyNumberString,
  eventIndex: AnyNumberString
): Types["ArenaVaultBalanceUpdateEvent"] => ({
  newBalance: BigInt(data.new_balance),
  eventName: "ArenaVaultBalanceUpdate",
  ...withVersionAndEventIndex({ version, eventIndex }),
});
