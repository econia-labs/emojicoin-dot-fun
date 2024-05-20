import { PostgrestClient } from "@supabase/postgrest-js";
import { Hex } from "@aptos-labs/ts-sdk";
import { MarketRegistrationEvent } from "../emojicoin_dot_fun/events";
import { INBOX_URL, LIMIT, ORDER_BY, TABLE_NAME } from "./const";
import { type MarketMetadata } from "../types";
import { getEmojiData } from "../emoji_data";
import { Uint64String } from "../emojicoin_dot_fun";

export const getAllMarketEvents = async ({
  inboxUrl = INBOX_URL,
  limit = LIMIT,
}: {
  inboxUrl?: string;
  limit?: number;
}): Promise<MarketRegistrationEvent[]> => {
  if (!inboxUrl) {
    throw new Error(`Invalid inboxUrl: ${inboxUrl}`);
  }
  const postgrest = new PostgrestClient(inboxUrl);

  const aggregated: MarketRegistrationEvent[] = [];
  let go = true;
  while (go) {
    const offset = aggregated.length;
    /* eslint-disable-next-line no-await-in-loop */
    const [count, data] = await postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", MarketRegistrationEvent.STRUCT_STRING)
      .order("transaction_version", ORDER_BY.DESC)
      .range(offset, offset + limit - 1)
      .then((res) => [res.count ?? 0, res.data ?? []] as const);

    aggregated.push(...data.map((v) => MarketRegistrationEvent.from(v)));
    go = count !== 0;
  }
  return aggregated;
};

export type MarketMetadataWithName = MarketMetadata & ReturnType<typeof getEmojiData>;

export const getMarketData = async ({
  inboxUrl = INBOX_URL,
  limit = LIMIT,
}: {
  inboxUrl?: string;
  limit?: number;
}): Promise<Record<Uint64String, MarketMetadataWithName>> => {
  const res: Record<Uint64String, MarketMetadataWithName> = {};
  const markets = await getAllMarketEvents({ inboxUrl, limit });
  markets.forEach((m) => {
    const marketID = Number(m.data.marketMetadata.marketID);
    const emojiHexBytes = Hex.fromHexInput(m.data.marketMetadata.emojiBytes);
    res[marketID] = {
      ...m.data.marketMetadata,
      // TODO: Write a test that asserts this.
      ...getEmojiData(emojiHexBytes.toString() as `0x${string}`)!,
    };
  });
  return res;
};

export default getMarketData;
