import { Box, Column, Flex } from "@/containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";
import getInitialMarketData from "lib/queries/initial/markets";
import { type JSONTypes, toMarketView } from "@/sdk/types";
import { getEmojiData } from "@/sdk/emoji_data";

const Home = async () => {
  let markets = await getInitialMarketData();

  // Fallback to use for production data because we don't have a remote database endpoint right now.
  if (process.env.INBOX_URL === "http://localhost:3000" && process.env.VERCEL === "1") {
    console.warn("Warning: The `inbox` endpoint URL is set to `localhost` in production. Using sample market data.");
    const sampleDataURL = "https://sample-data.sfo3.cdn.digitaloceanspaces.com/data.json";
    const response = await fetch(sampleDataURL);
    const data: Array<JSONTypes.MarketView> = await response.json();
    markets = data.map(market => ({
      market: toMarketView(market),
      emoji: getEmojiData(market.metadata.emoji_bytes)!,
      volume24H: BigInt(Math.floor(Math.random() * 1337 ** 3)),
    }));
    // Sort by market cap.
    markets.sort((m1, m2) =>
      m2.market.instantaneousStats.marketCap < m1.market.instantaneousStats.marketCap
        ? -1
        : m2.market.instantaneousStats.marketCap > m1.market.instantaneousStats.marketCap
          ? 1
          : 0,
    );
  }

  const featuredMarket = markets.toReversed().pop();
  const gridMarkets = markets.slice(1);

  return (
    <Box pt="93px">
      <Column mb="31px">
        <ClientsSlider />

        <Flex px={{ _: "16px", mobileL: "24px" }} mx="auto" width="100%" maxWidth="100%" justifyContent="center">
          <MainCard featured={featuredMarket} />
        </Flex>

        <ClientsSlider />
      </Column>

      <EmojiTable markets={gridMarkets} />
    </Box>
  );
};

export default Home;
