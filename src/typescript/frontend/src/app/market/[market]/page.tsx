import { fetchLatestMarketState } from "lib/queries/initial/state";
import fetchInitialSwapData from "lib/queries/initial/swaps";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import EmojiNotFoundPage from "./not-found";
import fetchInitialChatData from "lib/queries/initial/chats";
import { REVALIDATION_TIME } from "lib/server-env";
import { fetchContractMarketView } from "lib/queries/aptos-client/market-view";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { pathToEmojiNames } from "utils/pathname-helpers";
import { prettifyHex } from "lib/utils/prettify-hex";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";

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
  const bytes = names.flatMap((n) => Array.from(SYMBOL_DATA.byName(n)?.bytes ?? []));
  const hex = prettifyHex(bytes);
  const res = await fetchLatestMarketState(hex);

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));

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
        geoblocked={geoblocked}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
