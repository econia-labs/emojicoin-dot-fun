import React from "react";

import { FlexGap } from "@containers";
import { Text } from "components/text";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";
import { useMatchBreakpoints } from "@hooks/index";

export type ButtonsBlockProps = {
  value: number;
  numPages: number;
  onChange: (page: number) => void;
  className?: string;
};

const ButtonsBlock: React.FC<ButtonsBlockProps> = ({
  value,
  numPages,
  onChange,
  className,
}: ButtonsBlockProps) => {
  const { isMobile } = useMatchBreakpoints();
  const gap = isMobile ? "12px" : "17px";
  return (
    <FlexGap className={className} gap={gap} justifyContent="center">
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
          {numPages}
        </Text>

        <Text className="med-pixel-text" fontSize="48px" color="darkGray">
          {"}"}
        </Text>
      </FlexGap>

      {/* Right */}
      <StyledBtn
        onClick={() => {
          if (value < numPages) {
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
      <StyledBtn onClick={() => onChange(numPages)}>
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
