import { toEmojicoinDotFunStructTag } from "../utils/type-tags";

export const TYPE_TAGS = {
  SwapEvent: toEmojicoinDotFunStructTag("Swap"),
  ChatEvent: toEmojicoinDotFunStructTag("Chat"),
  MarketRegistrationEvent: toEmojicoinDotFunStructTag("MarketRegistration"),
  PeriodicStateEvent: toEmojicoinDotFunStructTag("PeriodicState"),
  StateEvent: toEmojicoinDotFunStructTag("State"),
  GlobalStateEvent: toEmojicoinDotFunStructTag("GlobalState"),
  LiquidityEvent: toEmojicoinDotFunStructTag("Liquidity"),
} as const;

export const STRUCT_STRINGS = {
  SwapEvent: TYPE_TAGS.SwapEvent.toString(),
  ChatEvent: TYPE_TAGS.ChatEvent.toString(),
  MarketRegistrationEvent: TYPE_TAGS.MarketRegistrationEvent.toString(),
  PeriodicStateEvent: TYPE_TAGS.PeriodicStateEvent.toString(),
  StateEvent: TYPE_TAGS.StateEvent.toString(),
  GlobalStateEvent: TYPE_TAGS.GlobalStateEvent.toString(),
  LiquidityEvent: TYPE_TAGS.LiquidityEvent.toString(),
} as const;
