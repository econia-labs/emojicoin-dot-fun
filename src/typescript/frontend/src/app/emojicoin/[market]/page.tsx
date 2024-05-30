import getInitialChatData from "lib/queries/initial/chats";
import { fetchTopMarkets } from "lib/queries/initial/markets";
import { fetchLastMarketState } from "lib/queries/initial/state";
import getInitialSwapData from "lib/queries/initial/swaps";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";

// We will revalidate the data cache every hour. This can be adjusted later based on how much data is fetched.
export const revalidate = (process.env.SHORT_REVALIDATE === "true") ? 10 : 3600;

type StaticParams = {
  market: string;
};

export const generateStaticParams = async (): Promise<Array<StaticParams>> => {
  const data = await fetchTopMarkets();
  return data.map((v) => ({
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
      <ClientEmojicoinPage
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

  return <ClientEmojicoinPage />;
};

export default EmojicoinPage;
