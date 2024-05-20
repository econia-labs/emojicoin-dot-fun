import { getEmojiDataByName } from "@/sdk/emoji_data";
import { CandlestickResolution } from "@/sdk/emojicoin_dot_fun";
import { getAllCandlesticks } from "@/sdk/queries";
import Emojicoin from "components/pages/emojicoin";
import { resolveToEmojiSymbol } from "lib/chart-utils";
import { type Candlesticks, getMarkets } from "lib/queries/get-markets";

interface EmojicoinPageSlug {
  params: {
    market: string;
  };
}

export default async function EmojicoinPage({ params }: EmojicoinPageSlug) {
  const markets = await getMarkets();
  console.log(params.market);
  const symbol = resolveToEmojiSymbol(params.market) ?? getEmojiDataByName("red square").emoji;
  const marketWithSymbol = Object.keys(markets).find(m => markets[m].emoji === symbol);
  let market: (typeof markets)[keyof typeof markets] | undefined;
  let candlesticks: Candlesticks | undefined;
  // console.log(Object.keys(markets));
  console.log(symbol);
  console.log(marketWithSymbol);
  if (marketWithSymbol) {
    market = markets[marketWithSymbol];
    candlesticks = await getAllCandlesticks({
      marketID: Number(market.marketID),
      resolution: CandlestickResolution.PERIOD_1S,
    });
  }

  // console.dir(({s: "EmojicoinPage", markets, market, candlesticks }), { depth: null });
  return <Emojicoin markets={markets} market={market} candlesticks={candlesticks} />;
}
