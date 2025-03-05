import { postgrest, queryHelper, queryHelperSingle } from "..";
import { SymbolEmoji } from "../../../emoji_data";
import { TableName, toGeckoTerminalEvent, toGeckoTerminalLatestBlock } from "../../types";

const selectEvents = (params: { fromBlock: number; toBlock: number }) => {
  return postgrest
    .from(TableName.GeckoTerminalEvents)
    .select("*")
    .gte("block_number", params.fromBlock)
    .lte("block_number", params.toBlock);
};

const selectLatestBlock = () => {
  return postgrest.from(TableName.GeckoTerminalLatestBlock).select("*").single();
};

export const fetchEvents = queryHelper(selectEvents, toGeckoTerminalEvent);
export const fetchLatestBlock = queryHelperSingle(selectLatestBlock, toGeckoTerminalLatestBlock);

export const fetchAsset = async (marketAddress: string) => {
  return await postgrest
    .from(TableName.MarketLatestStateEvent)
    .select("symbol_emojis")
    .eq("market_address", marketAddress)
    .single()
    .then((r) => {
      if (r.error) {
        throw r.error;
      } else {
        return r.data.symbol_emojis as SymbolEmoji[];
      }
    });
};

export const fetchPair = async (marketAddress: string) => {
  return await postgrest
    .from(TableName.MarketRegistrationEvents)
    .select("sender, block_number, symbol_emojis, transaction_timestamp, transaction_version")
    .eq("market_address", marketAddress)
    .single()
    .then((r) => {
      if (r.error) {
        throw r.error;
      } else {
        return r.data;
      }
    });
};
