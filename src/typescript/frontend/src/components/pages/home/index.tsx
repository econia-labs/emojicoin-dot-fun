import { Box, Column, Flex } from "@/containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";
import getInitialMarketData from "lib/queries/initial/markets";

const Home = async () => {
  const markets = await getInitialMarketData();
  const featuredMarket = markets.toReversed().pop();
  const gridMarkets = markets.slice(1);

  return (
    <Box pt="93px">
      <Column mb="31px">
        <ClientsSlider />

        <Flex px={{ _: "16px", mobileL: "24px" }} mx="auto" width="100%" maxWidth="100%" justifyContent="center">
          <MainCard featuredMarket={featuredMarket} />
        </Flex>

        <ClientsSlider />
      </Column>

      <EmojiTable markets={gridMarkets} />
    </Box>
  );
};

export default Home;
