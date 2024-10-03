import {
  Ed25519Account,
  AccountAddress,
  type AccountAddressInput,
  type Uint8,
} from "@aptos-labs/ts-sdk";
import {
  toEmojicoinEvent,
  type Types,
  type AnyNumberString,
  type AnyEmojicoinEvent,
} from "@sdk-types";
import { triggerEnumToRawTrigger, Trigger } from "@sdk/const";
import { getRandomEmoji, type EmojicoinSymbol, generateRandomSymbol } from "@sdk/emoji_data";
import { getEmojicoinData } from "@sdk/markets/utils";
import type JsonTypes from "@sdk/types/json-types";
import { STRUCT_STRINGS } from "@sdk/utils";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import Big from "big.js";
import { getEventsAsProcessorModels } from "@sdk/mini-processor";
import { createEmptyEvents, type Events } from "@sdk/emojicoin_dot_fun/events";

/**
 * Note that this data is generated solely for animation purposes. It isn't logically consistent
 * and a lot of the fields are incorrect or inconsistent in terms of what could actually exist
 * on-chain.
 */

type AnimationTriggers =
  | Trigger.MarketRegistration
  | Trigger.SwapBuy
  | Trigger.SwapSell
  | Trigger.ProvideLiquidity
  | Trigger.RemoveLiquidity
  | Trigger.Chat;

const getRandomAnimationTrigger = () => {
  const triggers = [
    Trigger.MarketRegistration,
    Trigger.SwapBuy,
    Trigger.SwapSell,
    Trigger.ProvideLiquidity,
    Trigger.RemoveLiquidity,
    Trigger.Chat,
  ] as const;
  return triggers[Math.floor(Math.random() * triggers.length)];
};

const triggerToStructString = (trigger: AnimationTriggers) => {
  if (trigger === Trigger.MarketRegistration) return STRUCT_STRINGS.MarketRegistrationEvent;
  if (trigger === Trigger.SwapBuy) return STRUCT_STRINGS.SwapEvent;
  if (trigger === Trigger.SwapSell) return STRUCT_STRINGS.SwapEvent;
  if (trigger === Trigger.ProvideLiquidity) return STRUCT_STRINGS.LiquidityEvent;
  if (trigger === Trigger.RemoveLiquidity) return STRUCT_STRINGS.LiquidityEvent;
  if (trigger === Trigger.Chat) return STRUCT_STRINGS.ChatEvent;
  throw new Error(`Invalid trigger: ${trigger}`);
};

export type RandomEventArgs = {
  marketID: AnyNumberString;
  time?: AnyNumberString;
  marketNonce?: AnyNumberString;
  emojis?: EmojicoinSymbol;
  trigger?: AnimationTriggers;
  version?: AnyNumberString;
};

let nonce = 0;

export const generateRandomEvent = ({
  marketID,
  version,
  time = Date.now() * 1000,
  marketNonce = nonce++,
  emojis = generateRandomSymbol().emojis,
  trigger = getRandomAnimationTrigger(),
}: RandomEventArgs) => {
  const args = {
    marketID,
    time,
    marketNonce,
    emojis,
  };
  const eventType = triggerToStructString(trigger);
  const events: Events = createEmptyEvents();
  const t = eventType;
  const v = Number(version);
  let ev: AnyEmojicoinEvent;
  switch (trigger) {
    case Trigger.MarketRegistration:
      ev = toEmojicoinEvent(t, generateMarketRegistrationJSON(args), v);
      events.MarketRegistrationEvents.push(ev as Types["MarketRegistrationEvent"]);
      break;
    case Trigger.SwapBuy:
      ev = toEmojicoinEvent(t, generateSwapJSON({ ...args, isSell: false }), v);
      events.SwapEvents.push(ev as Types["SwapEvent"]);
      break;
    case Trigger.SwapSell:
      ev = toEmojicoinEvent(t, generateSwapJSON({ ...args, isSell: true }), v);
      events.SwapEvents.push(ev as Types["SwapEvent"]);
      break;
    case Trigger.ProvideLiquidity:
      ev = toEmojicoinEvent(t, generateLiquidityJSON({ ...args, liquidityProvided: true }), v);
      events.LiquidityEvents.push(ev as Types["LiquidityEvent"]);
      break;
    case Trigger.RemoveLiquidity:
      ev = toEmojicoinEvent(t, generateLiquidityJSON({ ...args, liquidityProvided: false }), v);
      events.LiquidityEvents.push(ev as Types["LiquidityEvent"]);
      break;
    case Trigger.Chat:
      ev = toEmojicoinEvent(t, generateChatJSON(args), v);
      events.ChatEvents.push(ev as Types["ChatEvent"]);
      break;
    default:
      throw new Error(`Invalid trigger: ${trigger}`);
  }
  const stateJSON = generateStateJSON({ ...args, trigger: triggerEnumToRawTrigger(trigger) });
  const stateEvent = toEmojicoinEvent(
    STRUCT_STRINGS.StateEvent,
    stateJSON,
    Number(version)
  ) as Types["StateEvent"];
  events.StateEvents.push(stateEvent);

  const models = getEventsAsProcessorModels(events, {
    sender: "0x0123",
    entryFunction: "0x1234::some_contract::function",
    version: BigInt(version ?? 7777777),
    time: 0n,
  });

  const triggeringEvent = (() => {
    switch (trigger) {
      case Trigger.MarketRegistration:
        return models.marketRegistrationEvents.pop();
      case Trigger.SwapBuy:
        return models.swapEvents.pop();
      case Trigger.SwapSell:
        return models.swapEvents.pop();
      case Trigger.ProvideLiquidity:
        return models.liquidityEvents.pop();
      case Trigger.RemoveLiquidity:
        return models.liquidityEvents.pop();
      case Trigger.Chat:
        return models.chatEvents.pop();
      default:
        throw new Error(`Invalid trigger: ${trigger}`);
    }
  })();

  const stateEventModel = models.marketLatestStateEvents.pop();

  if (!triggeringEvent || !stateEventModel) {
    throw new Error("Something went wrong and the events were parsed incorrectly.");
  }

  return {
    triggeringEvent,
    stateEvent: stateEventModel,
  };
};

const generateMarketRegistrationJSON = ({
  marketID,
  emojis,
  time,
  registrant = AccountAddress.from(Ed25519Account.generate().accountAddress),
}: {
  marketID: AnyNumberString;
  emojis: EmojicoinSymbol;
  time: AnyNumberString;
  registrant?: AccountAddressInput;
}): JsonTypes["MarketRegistrationEvent"] => {
  const { marketAddress, symbolBytes } = getEmojicoinData(emojis);
  return {
    integrator: INTEGRATOR_ADDRESS,
    integrator_fee: "0",
    market_metadata: {
      emoji_bytes: symbolBytes,
      market_address: marketAddress.toString(),
      market_id: marketID.toString(),
    },
    registrant: AccountAddress.from(registrant).toString(),
    time: time.toString(),
  };
};

const generateLiquidityJSON = ({
  marketID,
  marketNonce,
  time = Date.now() * 1000,
  liquidityProvided,
}: {
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
  time?: AnyNumberString;
  liquidityProvided: boolean;
}): JsonTypes["LiquidityEvent"] => ({
  base_amount: "1524336998",
  liquidity_provided: liquidityProvided,
  lp_coin_amount: "1212122424",
  market_id: marketID.toString(),
  market_nonce: marketNonce.toString(),
  base_donation_claim_amount: "0",
  quote_donation_claim_amount: "0",
  provider: "0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b8adf1e90ae6037f1fcbabe",
  quote_amount: "1200000000",
  time: time.toString(),
});

const generateStateJSON = ({
  marketID,
  marketNonce,
  trigger,
  emojis,
  time = Date.now() * 1000,
  lastSwapNonce = marketNonce,
  lastSwapTime = Date.now() * 1000,
  isSell = Math.random() > 0.5,
}: {
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
  trigger: Uint8;
  emojis: EmojicoinSymbol;
  time?: AnyNumberString;
  lastSwapNonce?: AnyNumberString;
  lastSwapTime?: AnyNumberString;
  isSell?: boolean;
}): JsonTypes["StateEvent"] => {
  const { marketAddress, symbolBytes } = getEmojicoinData(emojis);
  return {
    clamm_virtual_reserves: {
      base: "49000000000000000",
      quote: "400000000000",
    },
    cpamm_real_reserves: {
      base: "0",
      quote: "0",
    },
    cumulative_stats: {
      base_volume: "0",
      integrator_fees: "100000000",
      n_chat_messages: "3",
      n_swaps: "0",
      pool_fees_base: "0",
      pool_fees_quote: "0",
      quote_volume: "0",
    },
    instantaneous_stats: {
      fully_diluted_value: "367346938775",
      market_cap: "0",
      total_quote_locked: "0",
      total_value_locked: "0",
    },
    last_swap: {
      avg_execution_price_q64: "0",
      base_volume: "0",
      is_sell: isSell,
      nonce: lastSwapNonce.toString(),
      quote_volume: "0",
      time: lastSwapTime.toString(),
    },
    lp_coin_supply: "0",
    market_metadata: {
      emoji_bytes: symbolBytes,
      market_address: marketAddress.toString(),
      market_id: marketID.toString(),
    },
    state_metadata: {
      bump_time: time.toString(),
      market_nonce: marketNonce.toString(),
      trigger,
    },
  };
};

const generateSwapJSON = ({
  isSell,
  marketID,
  marketNonce,
  inputAmount = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
  time = Date.now() * 1000,
  swapper = AccountAddress.from(Ed25519Account.generate().accountAddress),
  resultsInStateTransition = false,
  startsInBondingCurve = true,
}: {
  isSell: boolean;
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
  inputAmount?: AnyNumberString;
  time?: AnyNumberString;
  resultsInStateTransition?: boolean;
  startsInBondingCurve?: boolean;
  swapper?: AccountAddressInput;
}): JsonTypes["SwapEvent"] => {
  return {
    // The ratios here are based on a random swap in the contract generated on-chain.
    avg_execution_price_q64: Big(153481808316888)
      .div(17302124)
      .mul(inputAmount.toString())
      .round()
      .toString(),
    // prettier-ignore
    base_volume: Big(2079515851811)
      .div(17302124)
      .mul(inputAmount.toString())
      .round()
      .toString(),
    input_amount: inputAmount.toString(),
    integrator: INTEGRATOR_ADDRESS,
    integrator_fee: "0",
    integrator_fee_rate_bps: INTEGRATOR_FEE_RATE_BPS,
    is_sell: isSell,
    market_id: marketID.toString(),
    market_nonce: marketNonce.toString(),
    net_proceeds: "2079515851811",
    pool_fee: "0",
    quote_volume: "17302124",
    results_in_state_transition: resultsInStateTransition,
    starts_in_bonding_curve: startsInBondingCurve,
    swapper: AccountAddress.from(swapper).toString(),
    time: time.toString(),
    balance_as_fraction_of_circulating_supply_before_q64: "0",
    balance_as_fraction_of_circulating_supply_after_q64: "0",
  };
};

const generateChatJSON = ({
  marketID,
  time = Date.now() * 1000,
  marketNonce,
  emojis,
  user = AccountAddress.from(Ed25519Account.generate().accountAddress),
}: {
  marketID: AnyNumberString;
  marketNonce: AnyNumberString;
  user?: AccountAddressInput;
  emojis: EmojicoinSymbol;
  time?: AnyNumberString;
}): JsonTypes["ChatEvent"] => {
  const { marketAddress, symbolBytes } = getEmojicoinData(emojis);
  return {
    balance_as_fraction_of_circulating_supply_q64: "0",
    circulating_supply: "0",
    emit_market_nonce: marketNonce.toString(),
    emit_time: time.toString(),
    market_metadata: {
      emoji_bytes: symbolBytes,
      market_address: marketAddress.toString(),
      market_id: marketID.toString(),
    },
    message: Array.from({ length: Math.random() * 10 })
      .map(() => getRandomEmoji().emoji)
      .join(""),
    user: AccountAddress.from(user).toString(),
    user_emojicoin_balance: "0",
  };
};
