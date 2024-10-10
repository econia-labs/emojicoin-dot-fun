import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import EmojiNotFoundPage from "./not-found";
import { REVALIDATION_TIME } from "lib/server-env";
import { fetchContractMarketView } from "lib/queries/aptos-client/market-view";
import { MarketSymbolEmojis, SYMBOL_DATA } from "@sdk/emoji_data";
import { pathToEmojiNames } from "utils/pathname-helpers";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";
import { fetchChatEvents, fetchMarketState, fetchSwapEvents } from "@/queries/market";
import { deriveEmojicoinPublisherAddress } from "@sdk/emojicoin_dot_fun";
import { QueryType } from "utils";
import { ROUTES } from "router/routes";
import { redirect } from "next/navigation";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

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
  let emojis: MarketSymbolEmojis;
  try {
    emojis = names.map((n) => {
      const res = SYMBOL_DATA.byName(n)?.emoji;
      if (!res) {
        throw new Error(`Cannot parse invalid emoji input: ${marketSlug}, names: ${names}`);
      }
      return res;
    });
  } catch (_) {
    return <EmojiNotFoundPage />;
  }

  let state: QueryType<typeof fetchMarketState>;

  try {
    state = await fetchMarketState({ searchEmojis: emojis });
  } catch (e) {
    console.log(e);
    redirect(ROUTES.maintenance);
  }

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));

  if (state) {
    const { marketID } = state.market;
    const marketAddress = deriveEmojicoinPublisherAddress({ emojis });

    let chats: QueryType<typeof fetchChatEvents>;
    let swaps: QueryType<typeof fetchSwapEvents>;
    let marketView: QueryType<typeof fetchContractMarketView>;

    try {
      chats = await fetchChatEvents({ marketID });
      swaps = await fetchSwapEvents({ marketID });
      marketView = await fetchContractMarketView(marketAddress.toString());
    } catch (e) {
      console.log(e);
      redirect(ROUTES.maintenance);
    }

    return (
      <ClientEmojicoinPage
        data={{
          symbol: state.market.symbolData.symbol,
          swaps,
          chats,
          state,
          marketView,
          ...state.market,
        }}
        geoblocked={geoblocked}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
