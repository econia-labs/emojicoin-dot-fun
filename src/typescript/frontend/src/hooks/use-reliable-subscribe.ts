import { useEventStore } from "context/event-store-context/hooks";
import { useEffect } from "react";

import type { SubscribableBrokerEvents } from "@/broker/types";

// Note that we let the charting library handle the subscription to arena periods.
type ReliableSubscribeArgs = {
  eventTypes: Array<SubscribableBrokerEvents>;
  arena?: boolean;
};

/**
 * Helper hook to manage the subscriptions to a set of topics while the component using it is
 * mounted. It automatically cleans up subscriptions when the component is unmounted.
 */
export const useReliableSubscribe = (args: ReliableSubscribeArgs) => {
  const { eventTypes, arena } = args;
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);
  const unsubscribeEvents = useEventStore((s) => s.unsubscribeEvents);

  useEffect(() => {
    // Don't subscribe right away, to let other components unmounting time to unsubscribe, that way
    // components unmounting don't undo/overwrite another component subscribing.
    const timeout = window.setTimeout(() => {
      subscribeEvents(eventTypes, {
        arenaBaseEvents: arena,
      });
    }, 250);

    // Unsubscribe from all topics passed into the hook when the component unmounts.
    return () => {
      clearTimeout(timeout);
      unsubscribeEvents(eventTypes, {
        arenaBaseEvents: arena,
      });
    };
  }, [eventTypes, arena, subscribeEvents, unsubscribeEvents]);
};
