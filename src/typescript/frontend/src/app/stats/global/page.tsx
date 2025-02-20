import { RegistryView } from "@/contract-apis";
import { toRegistryView } from "@sdk-types";
import { fetchMarkets, postgrest } from "@sdk/indexer-v2/queries";
import { TableName, toChatEventModel, type MarketStateModel } from "@sdk/indexer-v2/types";
import { compareBigInt, getAptosClient } from "@sdk/utils";
import { GlobalStatsComponent } from "./GlobalStats";
import { calculateGlobalStats } from "./calculate-stats";
import { Trigger } from "@sdk/const";
import { getEmojisInString } from "@sdk/emoji_data";

export const revalidate = 60;
export const dynamic = "force-static";

// Ensure a max number of pages fetched per `global/page.tsx` generation. At 500 rows per individual query, this will
// begin to return incomplete statistics at 10,000+ markets. Currently there are roughly ~2,200 on mainnet.
const MAX_PAGES_PER_QUERY = 20;

export default async function GlobalStatsPage() {
  const registryResourcePromise = RegistryView.view({ aptos: getAptosClient() });

  let page = 1;
  const pageSize = 500;
  const allMarketData: MarketStateModel[] = [];
  do {
    const data = await fetchMarkets({ page, pageSize });
    allMarketData.push(...data);
    page += 1;
    if (data.length !== pageSize) {
      break;
    }
  } while (page <= MAX_PAGES_PER_QUERY);

  const registryResource = await registryResourcePromise.then(toRegistryView);

  const lastChatEvent = allMarketData
    .filter((v) => v.market.trigger === Trigger.Chat)
    .sort((a, b) => compareBigInt(a.market.time, b.market.time))
    .at(-1);

  const chatEmojis = lastChatEvent
    ? await postgrest
        .from(TableName.ChatEvents)
        .select("*")
        .eq("market_nonce", lastChatEvent.market.marketNonce)
        .eq("market_id", lastChatEvent.market.marketID)
        .single()
        .then((res) => res.data)
        .then(toChatEventModel)
        .then((res) => res.chat.message)
        .then(getEmojisInString)
    : [];

  const globalStats = calculateGlobalStats({ allMarketData, registryResource });
  return <GlobalStatsComponent {...globalStats} lastChatMessageEmojis={chatEmojis} />;
}
