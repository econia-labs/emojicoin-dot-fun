import { getRegistrationGracePeriodFlag } from "@sdk/markets/utils";
import { standardizeAddress } from "@sdk/utils/account-address";
import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEffect, useMemo, useState } from "react";

// -------------------------------------------------------------------------------------------------
//
//                        Utilities for calculating the number of seconds left.
//
// -------------------------------------------------------------------------------------------------
const nowSeconds = () => Math.floor(new Date().getTime() / 1000);

const calculateSecondsLeft = (marketRegistrationTime: bigint) => {
  const registrationTime = marketRegistrationTime;
  const asSeconds = Math.floor(Number(registrationTime / 1_000_000n));
  const plusFiveMinutes = asSeconds + 300;
  return Math.max(plusFiveMinutes - nowSeconds(), 0);
};

const formattedTimeLeft = (secondsRemaining: number) => {
  const remainder = secondsRemaining % 60;
  const minutes = Math.floor(secondsRemaining / 60);
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}` as const;
};

// -------------------------------------------------------------------------------------------------
//
//                  Hook to force the component to re-render on an interval basis.
//
// -------------------------------------------------------------------------------------------------
const useDisplayTimeLeft = (marketRegistrationTime?: bigint) => {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof formattedTimeLeft>>();

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof marketRegistrationTime === "undefined") {
        setTimeLeft(undefined);
        return;
      }
      const secondsLeft = calculateSecondsLeft(marketRegistrationTime);
      const formatted = formattedTimeLeft(secondsLeft);
      setTimeLeft(formatted);
    }, 100);

    return () => clearInterval(interval);
  }, [marketRegistrationTime]);

  return timeLeft;
};

// -------------------------------------------------------------------------------------------------
//
//            `useQuery` hook that fetches the grace period status on an interval basis.
//
// -------------------------------------------------------------------------------------------------
const useGracePeriod = (symbol: string, hasSwaps: boolean) => {
  const { aptos } = useAptos();
  const [keepFetching, setKeepFetching] = useState(true);

  // Include the seconds left in the query result to trigger re-renders upon each fetch.
  const query = useQuery({
    queryKey: ["grace-period", symbol],
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    enabled: keepFetching,
    queryFn: async () => getRegistrationGracePeriodFlag({ aptos, symbol }),
  });

  // Stop fetching once the market has clearly been registered.
  useEffect(() => {
    const notInGracePeriod = query.data?.gracePeriodOver || hasSwaps;
    if (notInGracePeriod) {
      setKeepFetching(false);
    }
  }, [query.data?.gracePeriodOver, hasSwaps]);

  return query;
};

// -------------------------------------------------------------------------------------------------
//
//          The actual hook to be used in a component to display the amount of seconds left.
//
// -------------------------------------------------------------------------------------------------
export const useCanTradeMarket = (symbol: string) => {
  const { account } = useAptos();
  const hasSwaps = useEventStore((s) => (s.markets.get(symbol)?.swapEvents.length ?? 0) > 0);
  const { isLoading, data } = useGracePeriod(symbol, hasSwaps);

  const { canTrade, marketRegistrationTime } = useMemo(() => {
    const notInGracePeriod = data?.gracePeriodOver;
    const userAddress = account?.address && standardizeAddress(account.address);
    // Assume the user is the market registrant while the query is fetching in order to prevent
    // disallowing the actual registrant from trading while the query result is being fetched.
    const userIsRegistrant = data?.flag?.marketRegistrant === userAddress;
    return {
      canTrade: isLoading || userIsRegistrant || notInGracePeriod || hasSwaps,
      marketRegistrationTime: data?.flag?.marketRegistrationTime,
    };
  }, [isLoading, data, account?.address, hasSwaps]);

  const displayTimeLeft = useDisplayTimeLeft(marketRegistrationTime);

  return typeof displayTimeLeft === "undefined" || canTrade
    ? {
        canTrade: true as const,
        displayTimeLeft: undefined,
      }
    : {
        canTrade: false as const,
        displayTimeLeft,
      };
};
