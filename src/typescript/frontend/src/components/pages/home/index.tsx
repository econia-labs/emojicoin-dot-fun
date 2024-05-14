"use client";

import { Box, Container, Column } from "@/containers";
import ClientsSlider from "components/clients-slider";
import EmojiTable from "./components/emoji-table";
import MainCard from "./components/main-card";

const Home = () => {
  return (
    <Box pt="120px">
      <Column mb="31px">
        <ClientsSlider />

        <Container width="100%">
          <MainCard />
        </Container>

        <ClientsSlider />
      </Column>

      <EmojiTable />
    </Box>
  );
};

export default Home;
