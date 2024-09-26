import { type AnyEventModel, DatabaseTypeConverter } from "../indexer-v2/types";
import { type AnyEventDatabaseRow, TableName } from "../indexer-v2/types/json-types";

export type BrokerEvent =
  | "Chat"
  | "Swap"
  | "Liquidity"
  | "MarketLatestState"
  | "GlobalState"
  | "PeriodicState"
  | "MarketRegistration";

export const brokerMessageConverter: Record<BrokerEvent, (data: any) => AnyEventModel> = {
  Chat: (d) => DatabaseTypeConverter[TableName.ChatEvents](d),
  Swap: (d) => DatabaseTypeConverter[TableName.SwapEvents](d),
  Liquidity: (d) => DatabaseTypeConverter[TableName.LiquidityEvents](d),
  MarketLatestState: (d) => DatabaseTypeConverter[TableName.MarketLatestStateEvent](d),
  GlobalState: (d) => DatabaseTypeConverter[TableName.GlobalStateEvents](d),
  PeriodicState: (d) => DatabaseTypeConverter[TableName.PeriodicStateEvents](d),
  MarketRegistration: (d) => DatabaseTypeConverter[TableName.MarketRegistrationEvents](d),
};

/**
 * Note that this is primarily here to indicate the structure of the message.
 *
 * Due to the nature of `json-bigint` and how we default to parsing everything as a bigint,
 * technically the types for `AnyEventModel` will differ from the actual message that's parsed.
 *
 * This ultimately doesn't matter, because we process and convert each incoming message with the
 * corresponding `TableConverter` functions after parsing the initial JSON message.
 */
export type BrokerMessage = {
  [K in BrokerEvent]: AnyEventDatabaseRow;
};
