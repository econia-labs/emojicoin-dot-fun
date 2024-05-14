"use client";

import { Text } from "components/text";
import Planet from "components/svg/icons/Planet";
import { StyledSliderWrapper, StyledClientsWrapper, StyledClientsWrapperIn, StyledClientsItem } from "./styled";

const ClientsSlider: React.FC = () => {
  const clientsLogoList = ["Universal ownership", "Universal Blockchain", "Universal language"];

  return (
    <StyledSliderWrapper>
      <StyledClientsWrapper>
        <StyledClientsWrapperIn>
          {[...clientsLogoList, ...clientsLogoList, ...clientsLogoList, ...clientsLogoList, ...clientsLogoList].map(
            (clientsLogo, index) => (
              <StyledClientsItem key={index}>
                <Text textScale="pixelHeading3" textTransform="uppercase" color={"econiaBlue"}>
                  {clientsLogo}
                </Text>
                <Planet />
              </StyledClientsItem>
            ),
          )}
        </StyledClientsWrapperIn>
      </StyledClientsWrapper>
    </StyledSliderWrapper>
  );
};

export default ClientsSlider;
