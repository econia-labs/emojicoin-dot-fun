import { fetchLatestMarketState } from "lib/queries/initial/state";
import fetchInitialSwapData from "lib/queries/initial/swaps";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import EmojiNotFoundPage from "./not-found";
import fetchInitialChatData from "lib/queries/initial/chats";
import { REVALIDATION_TIME } from "lib/server-env";
import { fetchContractMarketView } from "lib/queries/aptos-client/market-view";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { pathToEmojiNames } from "utils/pathname-helpers";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";
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
  const { market: marketSlug } = params.params;
  const names = pathToEmojiNames(marketSlug);
  console.log({ names });
  const hex = names.map((n) => SYMBOL_DATA.byName(n)?.hex.slice(2)).join("");
  console.log({ hex });
  const res = await fetchLatestMarketState(`0x${hex}`);
  console.log({ res });

  if (res) {
    const marketID = res.marketID.toString();
    const chatData = await fetchInitialChatData({ marketID, maxTotalRows: CHAT_DATA_ROWS });
    const marketView = await fetchContractMarketView(res.marketAddress);
    const swapData = await fetchInitialSwapData({ marketID, maxTotalRows: SWAP_DATA_ROWS });
    return (
      <ClientEmojicoinPage
        data={{
          swaps: swapData,
          chats: chatData,
          marketView,
          ...res,
        }}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
