"use client";

import Planet from "components/svg/icons/Planet";
import {
  StyledSliderContainer,
  StyledWrapper,
  StyledInner,
  StyledItem,
  StyledText,
} from "./styled";

const ClientsSlider: React.FC = () => {
  const clientsLogoList = ["Universal ownership", "Universal Blockchain", "Universal language"];

  return (
    <StyledSliderContainer>
      <StyledWrapper>
        <StyledInner>
          {[
            ...clientsLogoList,
            ...clientsLogoList,
            ...clientsLogoList,
            ...clientsLogoList,
            ...clientsLogoList,
            ...clientsLogoList,
            ...clientsLogoList,
          ].map((clientsLogo, index) => (
            <StyledItem key={index}>
              <StyledText textScale="pixelHeading3" textTransform="uppercase" color={"econiaBlue"}>
                {clientsLogo}
              </StyledText>
              <Planet />
            </StyledItem>
          ))}
        </StyledInner>
      </StyledWrapper>
    </StyledSliderContainer>
  );
};

export default ClientsSlider;
