import Emojicoin from "components/pages/emojicoin";
import { SHORT_REVALIDATE } from "lib/env";
import getInitialChatData from "lib/queries/initial/chats";
import { SAMPLE_DATA_BASE_URL } from "lib/queries/initial/const";
import { fetchTopMarkets } from "lib/queries/initial/markets";
import { fetchLastMarketState } from "lib/queries/initial/state";
import getInitialSwapData from "lib/queries/initial/swaps";

// We will revalidate the data cache every hour. This can be adjusted later based on how much data is fetched.
export const revalidate = SHORT_REVALIDATE ? 10 : 3600;

type StaticParams = {
  market: string;
};

export const generateStaticParams = async (): Promise<Array<StaticParams>> => {
  const res = await fetch(new URL("top-market-data.json", SAMPLE_DATA_BASE_URL));
  const data2 = await res.json();
  console.warn(new URL("top-market-data.json", SAMPLE_DATA_BASE_URL));
  console.warn(res);
  console.warn(data2);
  const data = await fetchTopMarkets();
  return data.map(v => ({
    market: v.state.marketMetadata.marketID.toString(),
  }));
};

interface EmojicoinPageProps {
  params: StaticParams;
  searchParams: {};
}

const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const marketID = params.params.market;
  const res = await fetchLastMarketState(marketID);

  if (res) {
    const chatData = await getInitialChatData(marketID);
    const swapData = await getInitialSwapData(marketID);

    return (
      <Emojicoin
        data={{
          swaps: swapData,
          chats: chatData,
          emoji: res.emoji,
          state: res.state,
          market: res.market,
        }}
      />
    );
  }

  return <Emojicoin />;
};

export default EmojicoinPage;
