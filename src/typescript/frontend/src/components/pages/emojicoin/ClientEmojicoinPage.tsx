"use client";

import React, { useEffect } from "react";
import { useMatchBreakpoints } from "hooks";
import { Box } from "@containers";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/event-store-context";
import MainInfo from "./components/main-info/MainInfo";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type SubscribableBrokerEvents } from "@/broker/types";
import { marketToLatestBars } from "@/store/event/candlestick-bars";
import Carousel from "components/carousel";
import { Text } from "components";
import { GlobeIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { darkColors } from "theme";

const EVENT_TYPES: SubscribableBrokerEvents[] = ["Chat", "PeriodicState", "Swap"];

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isTablet, isMobile } = useMatchBreakpoints();
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const loadEventsFromServer = useEventStore((s) => s.loadEventsFromServer);
  const setLatestBars = useEventStore((s) => s.setLatestBars);

  useEffect(() => {
    const { chats, swaps, state, marketView } = props.data;
    loadMarketStateFromServer([state]);
    loadEventsFromServer([...chats, ...swaps]);
    const latestBars = marketToLatestBars(marketView);
    setLatestBars({ marketMetadata: state.market, latestBars });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.data]);

  useReliableSubscribe({ eventTypes: EVENT_TYPES });

  return (
    <Box>
      {props.isInMelee && (
        <Carousel gap={16}>
          <div className="flex flex-row items-center gap-[16px]">
            <Link href={ROUTES.arena}>
              <Text
                textScale="pixelHeading3"
                color="econiaBlue"
                className="w-max"
                textTransform="uppercase"
              >
                To trade this inside the melee, go to arena
              </Text>
            </Link>
            <GlobeIcon color={darkColors.econiaBlue} />
          </div>
        </Carousel>
      )}
      <MainInfo data={props.data} />
      {isTablet || isMobile ? <MobileGrid data={props.data} /> : <DesktopGrid data={props.data} />}
    </Box>
  );
};

export default ClientEmojicoinPage;
