import React from "react";

import { FlexGap } from "@containers";
import { Text } from "components/text";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";
import { useMatchBreakpoints } from "@hooks/index";

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
  const { isMobile } = useMatchBreakpoints();
  const gap = isMobile ? "12px" : "17px";
  return (
    <FlexGap gap={gap} justifyContent="center" marginTop="30px">
      {/* First */}
      <StyledBtn onClick={() => onChange(1)}>
        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"<<"}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
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
        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow className="med-pixel-search" rotate="180deg" />

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      <FlexGap
        style={{
          height: "fit-content",
        }}
        gap="12px"
      >
        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {value}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          /
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {numberOfPages}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </FlexGap>

      {/* Right */}
      <StyledBtn
        onClick={() => {
          if (value < numberOfPages) {
            onChange(value + 1);
          }
        }}
      >
        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Arrow className="med-pixel-search" />

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>

      {/* Last */}
      <StyledBtn onClick={() => onChange(numberOfPages)}>
        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"{"}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {">>"}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </StyledBtn>
    </FlexGap>
  );
};

export default ButtonsBlock;
