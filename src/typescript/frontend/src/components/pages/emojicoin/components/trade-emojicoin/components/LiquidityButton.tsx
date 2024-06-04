import { Flex } from "@containers";
import { type GridProps } from "components/pages/emojicoin/types";
import { StyledContentHeader } from "../../desktop-grid/styled";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { isInBondingCurve } from "utils/bonding-curve";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { useEffect } from "react";

export const LiquidityButton = (props: GridProps) => {
  const { t } = translationFunction();

  useEffect(() => {
    console.log("in bonding curve:", isInBondingCurve(props.data));
  });

  return (
    <StyledContentHeader>
      {!isInBondingCurve(props.data) ? (
        <Flex width="100%" justifyContent="center">
          <Button scale="lg">{t("Provide liquidity")}</Button>
        </Flex>
      ) : (
        <AnimatedProgressBar data={props.data} />
      )}
    </StyledContentHeader>
  );
};
