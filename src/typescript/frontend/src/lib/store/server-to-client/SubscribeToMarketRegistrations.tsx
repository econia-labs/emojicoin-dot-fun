"use client";

import { useWebSocketClient } from "context/data-context";
import { useEffect } from "react";

export const SubscribeToMarketRegistrations = () => {
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const unsubscribe = useWebSocketClient((s) => s.unsubscribe);

  useEffect(() => {
    subscribe.marketRegistration(null);

    return () => unsubscribe.marketRegistration(null);
  });

  return <></>;
};
