import { Flex } from "@containers";
import { type GridProps } from "components/pages/emojicoin/types";
import { StyledContentHeader } from "../desktop-grid/styled";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { isInBondingCurve } from "utils/bonding-curve";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { Link } from "components";

export const LiquidityButton = (props: GridProps) => {
  const { t } = translationFunction();

  return (
    <>
      {!isInBondingCurve(props.data) ? (
        <StyledContentHeader>
          <Flex width="100%" justifyContent="center">
            <Link href={`/pools?pool=${props.data.emojis.reduce((p, c) => `${p}${c.emoji}`, "")}`}>
              <Button scale="lg">{t("Provide liquidity")}</Button>
            </Link>
          </Flex>
        </StyledContentHeader>
      ) : (
        <StyledContentHeader className="!p-0">
          <AnimatedProgressBar data={props.data} />
        </StyledContentHeader>
      )}
    </>
  );
};
