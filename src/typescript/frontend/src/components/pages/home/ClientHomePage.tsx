import { Box, Column, Flex } from "@containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";
import { type MarketStateProps } from "./types";

export interface HomeProps {
  data?: Array<MarketStateProps>;
}

const ClientHomePage = async (props: HomeProps) => {
  const data = props.data ?? [];

  const featured = data.toReversed().pop();
  const gridMarkets = data.slice(1);

  return (
    <Box pt="93px">
      <Column mb="31px">
        <ClientsSlider />

        <Flex
          px={{ _: "16px", mobileL: "24px" }}
          mx="auto"
          width="100%"
          maxWidth="100%"
          justifyContent="center"
        >
          <MainCard featured={featured} />
        </Flex>

        <ClientsSlider />
      </Column>

      <EmojiTable data={gridMarkets} />
    </Box>
  );
};

export default ClientHomePage;
