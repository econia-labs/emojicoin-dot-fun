import EmojiNotFoundPage from "./not-found";
import { wrappedCachedContractMarketView } from "lib/queries/aptos-client/market-view";
import { SYMBOL_EMOJI_DATA } from "@sdk/emoji_data";
import { pathToEmojiNames } from "utils/pathname-helpers";
import { fetchChatEvents, fetchMarketState, fetchSwapEvents } from "@/queries/market";
import { getMarketAddress } from "@sdk/emojicoin_dot_fun";
import { type Metadata } from "next";
import { getAptPrice } from "lib/queries/get-apt-price";
// import { AptPriceContextProvider } from "context/AptPrice";
import dynamic from "next/dynamic";
import ClientEmojicoinPageV2 from "./ClientEmojicoinPageV2";
import { prisma } from "lib/prisma";

const AptPriceContextProvider = dynamic(() => import("context/AptPrice").then((mod) => mod.AptPriceContextProvider), {
  ssr: false,
});

export const revalidate = 2;

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

const EVENTS_ON_PAGE_LOAD = 25;

export async function generateMetadata({ params }: EmojicoinPageProps): Promise<Metadata> {
  const { market: coinSlug } = params;
  const title = `${coinSlug}`;
  const description = `Trade ${coinSlug} on emojicoin.fun !`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

/**
 * Note that our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const { market: coinSlug } = params.params;

  const coin = await prisma.coinsList.findFirst({
    where: {
      titleSlug: coinSlug,
    },
  }).catch((e) => {
    console.error("Failed to get coin:", e);
    return null;
  });

  const marketSlug = coin?.emojiSlug ?? coinSlug;

  const names = pathToEmojiNames(marketSlug);
  const emojis = names.map((n) => {
    const res = SYMBOL_EMOJI_DATA.byName(n)?.emoji;
    if (!res) {
      throw new Error(`Cannot parse invalid emoji input: ${marketSlug}, names: ${names}`);
    }
    return res;
  });

  const state = await fetchMarketState({ searchEmojis: emojis });

  if (state) {
    const { marketID } = state.market;
    const marketAddress = getMarketAddress(emojis);

    const [chats, swaps, marketView, aptPrice] = await Promise.all([
      fetchChatEvents({ marketID, pageSize: EVENTS_ON_PAGE_LOAD }),
      fetchSwapEvents({ marketID, pageSize: EVENTS_ON_PAGE_LOAD }),
      wrappedCachedContractMarketView(marketAddress.toString()),
      getAptPrice(),
    ]);

    return (
      <AptPriceContextProvider aptPrice={aptPrice}>
        <ClientEmojicoinPageV2
          data={{
            symbol: state.market.symbolData.symbol,
            swaps,
            chats,
            state,
            marketView,
            ...state.market,
          }}
        />
      </AptPriceContextProvider>
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
