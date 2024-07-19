import React from "react";

import { FlexGap } from "@containers";
import { Text } from "components/text";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";

export type ButtonsBlockProps = {
  value: number;
  numberOfPages: number;
  onChange: (page: number) => void;
};

const ButtonsBlock: React.FC<ButtonsBlockProps> = ({
  value,
  numberOfPages,
  onChange,
}: ButtonsBlockProps) => {
  return (
    <FlexGap gap="17px" justifyContent="center" marginTop="30px">
      {/* First */}
      <StyledBtn onClick={() => onChange(1)}>
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"<<"}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      {/* Left */}
      <StyledBtn
        onClick={() => {
          if (value > 1) {
            onChange(value - 1);
          }
        }}
      >
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow width="21px" rotate="180deg" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      <>
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {value} / {numberOfPages}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </>

      {/* Right */}
      <StyledBtn
        onClick={() => {
          if (value < numberOfPages) {
            onChange(value + 1);
          }
        }}
      >
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow width="21px" />

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      {/* Last */}
      <StyledBtn onClick={() => onChange(numberOfPages)}>
        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {">>"}
        </Text>

        <Text textScale="pixelHeading2" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>
    </FlexGap>
  );
};

export default ButtonsBlock;
