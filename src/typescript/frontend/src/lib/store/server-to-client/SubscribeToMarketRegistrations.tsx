"use client";

import { useWebSocketClient } from "context/state-store-context";
import { useEffect } from "react";

export const SubscribeToMarketRegistrations = () => {
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const requestUnsubscribe = useWebSocketClient((s) => s.requestUnsubscribe);

  useEffect(() => {
    subscribe.marketRegistration(null);

    return () => requestUnsubscribe.marketRegistration(null);
  });

  return <></>;
};
