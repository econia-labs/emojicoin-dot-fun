import { Flex } from "@containers";
import { useMatchBreakpoints } from "@hooks/index";
import { isInBondingCurve } from "@sdk/utils/bonding-curve";
import Button from "components/button";
import { type GridProps } from "components/pages/emojicoin/types";
import { Text } from "components/text";
import { translationFunction } from "context/language-context";
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import Link from "next/link";
import { ROUTES } from "router/routes";

import { StyledContentHeader } from "../desktop-grid/styled";
import { AnimatedProgressBar } from "./AnimatedProgressBar";

export const LiquidityButton = (props: GridProps) => {
  const { isDesktop } = useMatchBreakpoints();
  const { t } = translationFunction();
  const { canTrade, displayTimeLeft } = useCanTradeMarket(props.data.symbol);

  return (
    <>
      {!isInBondingCurve(props.data.state.state) ? (
        <StyledContentHeader>
          <Flex width="100%" justifyContent="center">
            <Link
              href={{
                pathname: ROUTES.pools,
                query: { pool: props.data.emojis.map((e) => e.emoji).join("") },
              }}
            >
              <Button scale="lg">{t("Provide liquidity")}</Button>
            </Link>
          </Flex>
        </StyledContentHeader>
      ) : canTrade ? (
        <StyledContentHeader className="!p-0">
          <AnimatedProgressBar data={props.data} />
        </StyledContentHeader>
      ) : (
        <StyledContentHeader>
          <Flex width="100%" justifyContent="left">
            <Text
              textScale={isDesktop ? "pixelHeading3" : "pixelHeading4"}
              color="lightGray"
              textTransform="uppercase"
            >
              Grace period ends in {displayTimeLeft}
            </Text>
          </Flex>
        </StyledContentHeader>
      )}
    </>
  );
};
