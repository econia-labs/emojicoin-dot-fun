import { type SubscribableBrokerEvents } from "@/broker/types";
import { type PeriodTypeFromBroker } from "@econia-labs/emojicoin-sdk";
import { useEventStore } from "context/event-store-context/hooks";
import { useEffect } from "react";

export type ReliableSubscribeArgs = {
  eventTypes: Array<SubscribableBrokerEvents>;
  arena?: boolean;
  arenaPeriod?: PeriodTypeFromBroker;
};

/**
 * Helper hook to manage the subscriptions to a set of topics while the component using it is
 * mounted. It automatically cleans up subscriptions when the component is unmounted.
 */
export const useReliableSubscribe = (args: ReliableSubscribeArgs) => {
  const { eventTypes, arena, arenaPeriod } = args;
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);
  const unsubscribeEvents = useEventStore((s) => s.unsubscribeEvents);

  useEffect(() => {
    // Don't subscribe right away, to let other components unmounting time to unsubscribe, that way
    // components unmounting don't undo/overwrite another component subscribing.
    const timeout = window.setTimeout(() => {
      subscribeEvents(eventTypes, {
        baseEvents: arena,
        arenaPeriod,
      });
    }, 250);

    // Unsubscribe from all topics passed into the hook when the component unmounts.
    return () => {
      clearTimeout(timeout);
      unsubscribeEvents(eventTypes, {
        baseEvents: arena,
        arenaPeriod,
      });
    };
  }, [eventTypes, arena, arenaPeriod, subscribeEvents, unsubscribeEvents]);
};
