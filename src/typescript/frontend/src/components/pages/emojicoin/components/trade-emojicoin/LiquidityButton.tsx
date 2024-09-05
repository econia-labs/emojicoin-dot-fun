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

const timeLeft = (seconds: number) => {
  const remainder = seconds % 60;
  const minutes = Math.floor(seconds / 60);
  if (remainder === 0 && minutes === 1) {
    return `${minutes} minute left`;
  }
  if (remainder === 0) {
    return `${minutes} minutes left`;
  }
  if (minutes === 0 && remainder === 1) {
    return `${remainder} second left`;
  }
  if (minutes === 0) {
    return `${remainder} seconds left`;
  }
  if (remainder === 1 && minutes == 1) {
    return `${minutes} minute and ${remainder} second left`;
  }
  if (minutes === 1) {
    return `${minutes} minute and ${remainder} seconds left`;
  }
  if (remainder === 1) {
    return `${minutes} minutes and ${remainder} second left`;
  }
  return `${minutes} minutes and ${remainder} seconds left`;
};

const getNow = () => Math.floor(new Date().getTime() / 1000);

export const LiquidityButton = (props: GridProps) => {
  const { t } = translationFunction();
  const [now, setNow] = useState(getNow());
  const { isLoading, data } = useGracePeriod(props.data.symbol);
  data;

  const isInGracePeriod = isLoading ? false : !data!.gracePeriodOver;
  const registrationTime = Number((data?.flag?.marketRegistrationTime ?? 0n) / 1000000n);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(getNow());
    }, 1000);
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
          <Flex width="100%" justifyContent="center">
            <Text>Grace period ({timeLeft(now - registrationTime)} left)</Text>
          </Flex>
        </StyledContentHeader>
      )}
    </>
  );
};
