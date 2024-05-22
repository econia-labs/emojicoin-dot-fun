"use client";

import { Box, Column, Flex } from "@/containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";

const Home = () => {
  return (
    <Box pt="93px">
      <Column mb="31px">
        <ClientsSlider />

        <Flex px={{ _: "16px", mobileL: "24px" }} mx="auto" width="100%" maxWidth="100%" justifyContent="center">
          <MainCard />
        </Flex>

        <ClientsSlider />
      </Column>

      <EmojiTable />
    </Box>
  );
};

export default Home;
