import { SYMBOL_DATA } from "@/sdk/emoji_data/symbol-data";
import { MarketMetadataByMarketID, MarketView } from "@/sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toMarketView } from "@/sdk/types";
import { getAptos } from "@/sdk/utils/aptos-client";
import Emojicoin from "components/pages/emojicoin";
import { type EmojicoinProps } from "components/pages/emojicoin/types";
import { APTOS_NETWORK, SHORT_REVALIDATE } from "lib/env";
import getInitialChatData from "lib/queries/initial/chats";
import getInitialMarketData from "lib/queries/initial/markets";
import getInitialSwapData from "lib/queries/initial/swaps";

// We will revalidate the data cache every hour. This can be adjusted later based on how much data is fetched.
export const revalidate = SHORT_REVALIDATE ? 10 : 3600;

export const generateStaticParams = async () => {
  const markets = await getInitialMarketData();
  return markets.map(market => ({
    market: market.market.metadata.marketID.toString(),
  }));
};

interface EmojicoinPageProps {
  params: {
    market: string;
  };
  searchParams: {};
}

const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const markets = await getInitialMarketData();
  const foundMarket = markets.find(m => m.market.metadata.marketID.toString() === params.params.market);
  // If market is in the top 100 markets, it'll have already been fetched and cached.
  // Use the data.
  if (foundMarket) {
    const { market, emoji } = foundMarket;
    const chatData = await getInitialChatData(market.metadata.marketID);
    const swapData = await getInitialSwapData(market.metadata.marketID);

    return (
      <Emojicoin
        data={{
          swaps: swapData,
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
    const swapData = getInitialSwapData(marketID);

    await Promise.all([marketView, chatData, swapData]).then(([market, chats, swaps]) => {
      componentProps.data = {
        swaps,
        chats,
        emoji: SYMBOL_DATA.byHex(metadata.emoji_bytes)!,
        market: toMarketView(market),
      };
    });
  }

  return <Emojicoin {...componentProps} />;
};

export default EmojicoinPage;
