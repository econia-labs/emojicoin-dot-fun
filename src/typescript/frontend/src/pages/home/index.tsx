import React from "react";
// Components
import { Column, Container, Box, ClientsSlider } from "components";
import { MainCard, EmojiTable } from "./components";

const HomePage: React.FC = () => {
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

export default HomePage;
