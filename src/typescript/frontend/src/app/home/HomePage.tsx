import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card/MainCard";
import TextCarousel from "components/text-carousel/TextCarousel";
import { type fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import type fetchSortedMarketData from "lib/queries/sorting/market-data";

export interface HomePageProps {
  featured: Awaited<ReturnType<typeof fetchFeaturedMarket>>;
  markets: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"];
  count: number;
  children?: React.ReactNode;
}

export default async function HomePageComponent({
  featured,
  markets,
  count,
  children,
}: HomePageProps) {
  return (
    <>
      <div className="pt-[93px]">
        <div className="flex-col mb-[31px]">
          <TextCarousel />
          <div className="flex justify-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full">
            <MainCard featured={featured} totalNumberOfMarkets={count} />
          </div>
          {children}
          <TextCarousel />
        </div>

        {/* Should we pop featured off or just leave it in the grid? Much simpler to do the former. */}
        <EmojiTable data={markets} totalNumberOfMarkets={count} />
      </div>
    </>
  );
}
