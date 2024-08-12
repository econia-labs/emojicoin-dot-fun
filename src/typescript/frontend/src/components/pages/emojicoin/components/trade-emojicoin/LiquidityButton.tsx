import { Flex } from "@containers";
import { type GridProps } from "components/pages/emojicoin/types";
import { StyledContentHeader } from "../desktop-grid/styled";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { isInBondingCurve } from "utils/bonding-curve";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import Link from "next/link";
import { ROUTES } from "router/routes";

export const LiquidityButton = (props: GridProps) => {
  const { t } = translationFunction();

  return (
    <>
      {!isInBondingCurve(props.data) ? (
        <StyledContentHeader>
          <Flex width="100%" justifyContent="center">
            <Link href={{
              pathname: ROUTES.pools,
              query: { pool: props.data.emojis.map(e => e.emoji).join("") },
            }}>
              <Button scale="lg">{t("Provide liquidity")}</Button>
            </Link>
          </Flex>
        </StyledContentHeader>
      ) : (
        <StyledContentHeader className="!p-0">
          <AnimatedProgressBar geoblocked={props.geoblocked} data={props.data} />
        </StyledContentHeader>
      )}
    </>
  );
};
