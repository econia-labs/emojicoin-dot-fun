import { Box, Column, Flex } from "@/containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";
import { type SymbolEmojiData } from "@/sdk/emoji_data";
import { type ContractTypes } from "@/sdk/types/contract-types";

export interface HomeProps {
  markets: Array<{
    market: ContractTypes.MarketView;
    emoji: SymbolEmojiData;
    volume24H: bigint;
  }>;
}

const Home = async (props: HomeProps) => {
  const markets = props.markets;

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
