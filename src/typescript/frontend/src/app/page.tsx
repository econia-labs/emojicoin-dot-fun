import { type HomePageParams, toHomePageParamsWithDefault } from "lib/routes/home-page-params";
import HomePageComponent from "./home/HomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";
import { fetchFeaturedMarket, fetchMarkets, fetchNumRegisteredMarkets } from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomePageParams) {
  const { page, sortBy, orderBy, q } = toHomePageParamsWithDefault(searchParams);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  const numRegisteredMarkets = await fetchNumRegisteredMarkets();
  const featured = await fetchFeaturedMarket();
  const markets = await fetchMarkets({
    page,
    sortBy,
    orderBy,
    searchEmojis,
  });

  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));

  return (
    <HomePageComponent
      featured={featured}
      markets={markets}
      numRegisteredMarkets={numRegisteredMarkets}
      page={page}
      sortBy={sortBy}
      searchBytes={q}
      geoblocked={geoblocked}
    />
  );
}
