import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchCachedTopHolders } from "lib/queries/aptos-indexer/fetch-top-holders";
import type { Metadata } from "next";
import { emojiNamesToPath, pathToEmojiNames } from "utils/pathname-helpers";

import { fetchMarketStateJson } from "@/queries/market";
import { fetchAllMarketSymbols } from "@/queries/static-params";
import type { SymbolEmojiName } from "@/sdk/emoji_data";
import { SYMBOL_EMOJI_DATA } from "@/sdk/emoji_data";
import { getMarketAddress } from "@/sdk/emojicoin_dot_fun";
import { toMarketStateModel } from "@/sdk/index";

import EmojiNotFoundPage from "./not-found";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  // cpsell make sure this is all markets later- limiting here to avoid  hammering graphql indexer
  // for now.
  const markets = (await fetchAllMarketSymbols()).slice(
    0,
    Number(process.env.NUM_MARKETS ?? "0") || 100
  );
  const names = markets.map((v) => v.map((emoji) => SYMBOL_EMOJI_DATA.byEmojiStrict(emoji).name));
  const paths = names.map(emojiNamesToPath);
  return paths.map((path) => ({ market: path }));
}

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

const logAndReturnValue = <T extends [] | undefined | null>(dataType: string, onFailure: T) => {
  console.warn(`[WARNING]: Failed to fetch ${dataType}.`);
  return onFailure;
};

export async function generateMetadata({ params }: EmojicoinPageProps): Promise<Metadata> {
  const { market: marketSlug } = params;
  const names = pathToEmojiNames(marketSlug);
  const emojis = names.map((v) => SYMBOL_EMOJI_DATA.byStrictName(v).emoji);
  const title = `${emojis.join("")}`;
  const description = `Trade ${emojis.join("")} on emojicoin.fun !`;

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

const buildCachedMarketState = unstableCacheWrapper(
  fetchMarketStateJson,
  ["build-cached-market-state"],
  {
    tags: ["build-cached-market-state"],
  }
);

/**
 * Note that our queries work with the marketID, but the URL uses the emoji bytes with a URL encoding.
 * That is, if you paste the emoji 💅🏾 into the URL, it becomes %F0%9F%92%85%F0%9F%8F%BE.
 * Whereas the actual emoji bytes are: 0xf09f9285f09f8fbe.
 */
const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const { market: marketSlug } = params.params;
  const names: SymbolEmojiName[] = [];
  try {
    names.push(...pathToEmojiNames(marketSlug));
  } catch (e) {
    return <EmojiNotFoundPage />;
  }
  const emojis = names.map((v) => SYMBOL_EMOJI_DATA.byStrictName(v).emoji);
  // console.log(`time: ${new Date().toISOString()}, ${JSON.stringify(params)}`);

  const stateJson = await buildCachedMarketState({ searchEmojis: emojis });

  if (stateJson) {
    const state = toMarketStateModel(stateJson);
    const marketAddress = getMarketAddress(emojis).toString();

    const [holders] = await Promise.all([
      fetchCachedTopHolders(marketAddress).catch(() => logAndReturnValue("top holders", [])),
    ]);

    return (
      <ClientEmojicoinPage
        data={{
          symbol: state.market.symbolData.symbol,
          state,
          holders,
          ...state.market,
        }}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
