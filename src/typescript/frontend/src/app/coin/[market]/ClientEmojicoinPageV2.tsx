"use client";

import React, { useEffect } from "react";
import { useMatchBreakpoints } from "hooks";
import { useEventStore } from "context/event-store-context";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type BrokerEvent } from "@/broker/types";
import { type EmojicoinProps } from "components/pages/emojicoin/types";
import CoinDetailsHeader from "componentsV2/Coin/CoinDetailsHeader";
import CoinDetailsBody from "componentsV2/Coin/CoinDetailsBody";

const EVENT_TYPES: BrokerEvent[] = ["Chat", "PeriodicState", "Swap"];

const ClientEmojicoinPageV2 = (props: EmojicoinProps) => {
  const { isTablet, isMobile } = useMatchBreakpoints();
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const loadEventsFromServer = useEventStore((s) => s.loadEventsFromServer);
  const setLatestBars = useEventStore((s) => s.setLatestBars);

  useEffect(() => {
    const { chats, swaps, state, marketView } = props.data;
    loadMarketStateFromServer([state]);
    loadEventsFromServer([...chats, ...swaps]);
    const latestBars = [];
    setLatestBars({ marketMetadata: state.market, latestBars });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.data]);

  useReliableSubscribe({ eventTypes: EVENT_TYPES });

  return (
    <div className="relative overflow-hidden pt-[120px] md:pt-[130px] lg:pt-[130px]">
      <CoinDetailsHeader />
      <CoinDetailsBody data={props.data} />
    </div>
  );
};

export default ClientEmojicoinPageV2;
