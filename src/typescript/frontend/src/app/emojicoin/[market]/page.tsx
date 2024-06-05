import getInitialChatData from "lib/queries/initial/chats";
import { fetchLatestMarketState } from "lib/queries/initial/state";
import getInitialSwapData from "lib/queries/initial/swaps";
import ClientEmojicoinPage from "components/pages/emojicoin/ClientEmojicoinPage";
import fetchMarketData from "lib/queries/initial/market-data";
import EmojiNotFoundPage from "./not-found";
import { REVALIDATION_TIME } from "lib/env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "auto";

type StaticParams = {
  market: string;
};

export const generateStaticParams = async (): Promise<Array<StaticParams>> => {
  const data = await fetchMarketData();

  return data.map((v) => ({
    market: v.marketID.toString(),
  }));
};

interface EmojicoinPageProps {
  params: StaticParams;
  searchParams: {};
}

const EmojicoinPage = async (params: EmojicoinPageProps) => {
  const marketID = params.params.market;
  const res = await fetchLatestMarketState(marketID);

  if (res) {
    const chatData = await getInitialChatData(marketID);
    const swapData = await getInitialSwapData(marketID);
    return (
      <ClientEmojicoinPage
        data={{
          swaps: swapData,
          chats: chatData,
          ...res,
        }}
      />
    );
  }

  return <EmojiNotFoundPage />;
};

export default EmojicoinPage;
