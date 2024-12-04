import { Flex } from "@containers";
import { type GridProps } from "components/pages/emojicoin/types";
import { StyledContentHeader } from "../desktop-grid/styled";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { isInBondingCurve } from "@sdk/utils/bonding-curve";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import { Text } from "components/text";
import { useMatchBreakpoints } from "@hooks/index";

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
