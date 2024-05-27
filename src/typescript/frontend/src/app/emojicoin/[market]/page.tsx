import { SYMBOL_DATA } from "@/sdk/emoji_data/symbol-data";
import { MarketMetadataByMarketID, MarketView } from "@/sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toMarketView } from "@/sdk/types";
import { getAptos } from "@/sdk/utils/aptos-client";
import Emojicoin from "components/pages/emojicoin";
import { type EmojicoinProps } from "components/pages/emojicoin/types";
import { APTOS_NETWORK, SHORT_REVALIDATE } from "lib/env";
import getInitialChatData from "lib/queries/initial/chats";
import getInitialMarketData from "lib/queries/initial/markets";

// We will revalidate the data cache every hour. This can be adjusted later based on how much data is fetched.
export const revalidate = SHORT_REVALIDATE ? 10 : 3600;

export const generateStaticParams = async () => {
  // TODO: Fix this. This should be returning static data but it's not.
  try {
    const markets = await getInitialMarketData();
    return markets.map(market => ({
      market: market.market.metadata.marketID.toString(),
    }));
  } catch (e) {
    return [];
  }
};

interface EmojicoinPageProps {
  params: {
    market: string;
  };
  searchParams: {};
}

const EmojicoinPage = async (params: EmojicoinPageProps) => {
  console.warn("Building page route:", params.params.market);

  const markets = await getInitialMarketData();
  const foundMarket = markets.find(m => m.market.metadata.marketID.toString() === params.params.market);
  // If market is in the top 100 markets, it'll have already been fetched and cached.
  // Use the data.
  if (foundMarket) {
    console.warn("Found market in top 100 markets:", foundMarket.market.metadata.marketID.toString());
    const { market, emoji } = foundMarket;
    const chatData = await getInitialChatData(market.metadata.marketID);

    return (
      <Emojicoin
        data={{
          chats: chatData,
          emoji,
          market,
        }}
      />
    );
  }

  const marketID = BigInt(params.params.market);
  const aptos = getAptos(APTOS_NETWORK);
  // TODO: Optimize these calls..? If we index by market ID in the db it'll be much quicker to just
  // fetch the data by ID instead of having to make two separate calls to a node.
  const res = await MarketMetadataByMarketID.view({
    aptos,
    marketID,
  });

  const componentProps: EmojicoinProps = {};

  const metadata = res.vec.pop();
  if (metadata) {
    const marketView = MarketView.view({
      aptos,
      marketAddress: metadata.market_address,
    });
    const chatData = getInitialChatData(marketID);

    await Promise.all([marketView, chatData]).then(([market, chats]) => {
      componentProps.data = {
        chats,
        emoji: SYMBOL_DATA.byHex(metadata.emoji_bytes)!,
        market: toMarketView(market),
      };
    });
  }

  return <Emojicoin {...componentProps} />;
};

export default EmojicoinPage;
