import React from "react";

import { FlexGap } from "@containers";

import { Arrow } from "components/svg";
import { StyledBtn } from "./styled";
import { useMatchBreakpoints } from "@hooks/index";

export type ButtonsBlockProps = {
  value: number;
  numPages: number;
  onChange: (page: number) => void;
  className?: string;
};

const ButtonText = ({ text }: { text: number | string }) => (
  <p className="med-pixel-text font-[48px] text-dark-gray">{text}</p>
);

export const ButtonsBlock: React.FC<ButtonsBlockProps> = ({
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
        <ButtonText text={"{"} />
        <ButtonText text={"<<"} />
        <ButtonText text={"}"} />
      </StyledBtn>

      {/* Left */}
      <StyledBtn
        onClick={() => {
          if (value > 1) {
            onChange(value - 1);
          }
        }}
      >
        <ButtonText text={"{"} />
        <Arrow className="med-pixel-search-arrows" rotate="180deg" />
        <ButtonText text={"}"} />
      </StyledBtn>

      <FlexGap style={{ height: "fit-content" }} gap="12px">
        <ButtonText text={"{"} />
        <ButtonText text={value} />
        <ButtonText text={"/"} />
        <ButtonText text={numPages} />
        <ButtonText text={"}"} />
      </FlexGap>

      {/* Right */}
      <StyledBtn
        onClick={() => {
          if (value < numPages) {
            onChange(value + 1);
          }
        }}
      >
        <ButtonText text={"{"} />
        <Arrow className="med-pixel-search-arrows" />
        <ButtonText text={"}"} />
      </StyledBtn>

      {/* Last */}
      <StyledBtn onClick={() => onChange(numPages)}>
        <ButtonText text={"{"} />
        <ButtonText text={">>"} />
        <ButtonText text={"}"} />
      </StyledBtn>
    </FlexGap>
  );
};

export default ButtonsBlock;
