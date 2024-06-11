import getInitialChatData from "lib/queries/initial/chats";
import { fetchLatestMarketState } from "lib/queries/initial/state";
import getInitialSwapData from "lib/queries/initial/swaps";
import getInitialCandlesticks from "lib/queries/initial/candlesticks";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
// import fetchMarketData from "lib/queries/initial/market-data";
import EmojiNotFoundPage from "./not-found";
import { REVALIDATION_TIME } from "lib/server-env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";
// const NUM_MARKETS = 100;
const CHAT_DATA_ROWS = 100;
const SWAP_DATA_ROWS = 100;

/**
 * Our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
type StaticParams = {
  market: string;
};

// TODO: Bring back static params, but coalesce the top 50 markets across all filters
// and then build those pages only.

// export const generateStaticParams = async (): Promise<Array<StaticParams>> => {
//   const data = await fetchMarketData();

//   return data.map((v) => ({
//     market: v.marketID.toString(),
//   }));
// };

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
  const res = await fetchLatestMarketState(market);

  if (res) {
    const marketID = res.marketID.toString();
    const chatData = await getInitialChatData({ marketID, maxTotalRows: CHAT_DATA_ROWS });
    const swapData = await getInitialSwapData({ marketID, maxTotalRows: SWAP_DATA_ROWS });
    const candlesticks = await getInitialCandlesticks(marketID);
    return (
      <ClientEmojicoinPage
        data={{
          swaps: swapData,
          chats: chatData,
          candlesticks,
          ...res,
        }}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
