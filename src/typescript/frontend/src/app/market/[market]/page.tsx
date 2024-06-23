import { fetchLatestMarketState } from "lib/queries/initial/state";
import fetchInitialSwapData from "lib/queries/initial/swaps";
import fetchInitialCandlesticks from "lib/queries/initial/candlesticks";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import EmojiNotFoundPage from "./not-found";
import fetchInitialChatData from "lib/queries/initial/chats";
import { REVALIDATION_TIME } from "lib/server-env";
import { fetchLatestBars } from "@sdk/queries/candlestick";
import { RESOLUTIONS_ARRAY } from "@sdk/const";
import { LIMIT } from "@sdk/queries/const";
import { type Types } from "@sdk-types";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";
const CHAT_DATA_ROWS = 100;
const SWAP_DATA_ROWS = 100;
const CANDLESTICK_DATA_ROWS = 500;

/**
 * Our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
type StaticParams = {
  market: string;
};

// TODO: Bring back static params or caching with invalidation by some identifier for recent events having happened.

interface EmojicoinPageProps {
  params: StaticParams;
  searchParams: {};
}

/**
 * Note that our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const { market } = params.params;
  const res = await fetchLatestMarketState(BigInt(market));

  if (res) {
    const marketID = res.marketID.toString();
    const chatData = await fetchInitialChatData({ marketID, maxTotalRows: CHAT_DATA_ROWS });
    const candlesticks = await fetchInitialCandlesticks({
      marketID,
      maxTotalRows: CANDLESTICK_DATA_ROWS,
    });
    const { swaps, latestBarData } = await fetchLatestBars({
      marketID,
      resolutions: RESOLUTIONS_ARRAY,
      lastClose: candlesticks.at(0)?.closePriceQ64,
    });
    const swapData = new Array<Types.SwapEvent>();
    // If the latest bars returns enough swaps, we can use that for swapData since it always returns the latest data.
    if (swaps.length >= LIMIT) {
      // Ensure we're getting the most recent swaps by slicing the last LIMIT swaps.
      swapData.push(...swaps.slice(swaps.length - LIMIT));
    } else {
      const res = await fetchInitialSwapData({ marketID, maxTotalRows: SWAP_DATA_ROWS });
      swapData.push(...res);
    }
    return (
      <ClientEmojicoinPage
        data={{
          swaps: swapData,
          chats: chatData,
          candlesticks,
          latestBarData,
          ...res,
        }}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
