import React from "react";

import { FlexGap } from "@/containers";
import { Text } from "components/text";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";

const ButtonsBlock: React.FC = () => {
  return (
    <FlexGap gap="17px" justifyContent="center">
      <StyledBtn>
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGrey">
          {"{"}
        </Text>

        <Arrow width="21px" rotate="180deg" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGrey">
          {"}"}
        </Text>
      </StyledBtn>

      <StyledBtn>
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGrey">
          {"{"}
        </Text>

        <Arrow width="21px" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGrey">
          {"}"}
        </Text>
      </StyledBtn>
    </FlexGap>
  );
};

export default ButtonsBlock;
