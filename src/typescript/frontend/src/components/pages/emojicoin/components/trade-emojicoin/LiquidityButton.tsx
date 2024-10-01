import { Flex } from "@containers";
import { type GridProps } from "components/pages/emojicoin/types";
import { StyledContentHeader } from "../desktop-grid/styled";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { isInBondingCurve } from "utils/bonding-curve";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useGracePeriod } from "lib/hooks/queries/use-grace-period";
import { Text } from "components/text";
import { useEffect, useState } from "react";
import { useMatchBreakpoints } from "@hooks/index";
import { useQueryClient } from "@tanstack/react-query";

const timeLeft = (seconds: number) => {
  if (seconds <= 0) return "0 s";
  const remainder = seconds % 60;
  const minutes = Math.floor(seconds / 60);
  if (remainder === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${remainder} s`;
  }
  return `${minutes} min and ${remainder} s`;
};

const getNow = () => Math.floor(new Date().getTime() / 1000);

export const LiquidityButton = (props: GridProps) => {
  const { isDesktop } = useMatchBreakpoints();
  const { t } = translationFunction();
  const [now, setNow] = useState(getNow());
  const queryClient = useQueryClient();
  const { isLoading, data } = useGracePeriod(props.data.symbol);

  const isInGracePeriod = isLoading ? false : !data!.gracePeriodOver;
  const registrationTime = Number((data?.flag?.marketRegistrationTime ?? 0n) / 1000000n);

  useEffect(() => {
    const id = setInterval(() => {
      const n = getNow();
      setNow(n);
      if (60 * 5 - (n - registrationTime) < 0) {
        queryClient.invalidateQueries({queryKey: ["grace-period", props.data.symbol]});
      }
    }, 200);
    return () => clearInterval(id);
  });

  return (
    <>
      {!isInBondingCurve(props.data.state.state) && !isInGracePeriod ? (
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
      ) : !isInGracePeriod ? (
        <StyledContentHeader className="!p-0">
          <AnimatedProgressBar geoblocked={props.geoblocked} data={props.data} />
        </StyledContentHeader>
      ) : (
        <StyledContentHeader>
          <Flex width="100%" justifyContent="left">
            <Text
              textScale={isDesktop ? "pixelHeading3" : "pixelHeading4"}
              color="lightGray"
              textTransform="uppercase"
            >Grace period ({timeLeft(60 * 5 - (now - registrationTime))} left)</Text>
          </Flex>
        </StyledContentHeader>
      )}
    </>
  );
};
