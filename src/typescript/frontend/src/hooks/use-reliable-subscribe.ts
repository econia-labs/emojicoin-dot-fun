import { type ClientActions, RESUBSCRIPTION_DELAY } from "@store/websocket-store";
import { useWebSocketClient } from "context/state-store-context";
import { useEffect, useMemo } from "react";

export type SubscribeFunctions = {
  [key in keyof ClientActions["subscribe"]]: Parameters<ClientActions["subscribe"][key]>;
};

export type UnsubscribeFunctions = {
  [key in keyof ClientActions["requestUnsubscribe"]]: Parameters<
    ClientActions["requestUnsubscribe"][key]
  >;
};

/**
 * Helper hook to manage the subscriptions to a set of topics while the component using it is
 * mounted. It automatically cleans up subscriptions when the component is unmounted.
 *
 * NOTE: This could be an interval, but the primary motivator here is that some subscriptions
 * are dropped due to fluctuations in render cycle times where a component unmount calls unsubscribe
 * on a market that was just subscribed to in another component.
 *
 * We only need to call subscribe once and then again @see RESUBSCRIPTION_DELAY later to ensure that
 * the subscription is maintained even if another component with a similar market ID unmounts.
 *
 * @see RESUBSCRIPTION_DELAY
 *
 * @example
 * ```tsx
 * useReliableSubscribe({
 *   swap: [7n, true],
 *   periodicState: [948, 5],
 *   marketRegistration: ["328"],
 *   state: [null],
 * });
 *
 * // or something like...
 *
 * useReliableSubscribe({
 *   chat: [marketID],
 *   liquidity: [marketID],
 *   swap: [marketID, null],
 * });
 *
 * ```
 */
export const useReliableSubscribe = (
  funcAndArgs?: Partial<SubscribeFunctions & UnsubscribeFunctions>
) => {
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const requestUnsubscribe = useWebSocketClient((s) => s.requestUnsubscribe);
  const stringified = JSON.stringify(funcAndArgs);

  // Memoize the function and arguments to prevent unnecessary re-subscriptions.
  // We memoize the function and argument props with a simple JSON.stringify.
  /* eslint-disable react-hooks/exhaustive-deps */
  const handlers = useMemo(() => {
    if (typeof funcAndArgs === "undefined") {
      return;
    }
    return {
      callSubscribes: () => {
        Object.entries(funcAndArgs).forEach(([func, args]) => {
          subscribe[func](...args);
        });
      },
      callRequestUnsubscribes: () => {
        Object.entries(funcAndArgs).forEach(([func, args]) => {
          requestUnsubscribe[func](...args);
        });
      },
    };
  }, [stringified]);

  useEffect(() => {
    if (typeof handlers === "undefined") {
      return;
    }
    const { callSubscribes, callRequestUnsubscribes } = handlers;

    // Call subscribe once without waiting.
    callSubscribes();

    // Then, call subscribe again after a delay to ensure that the subscription is maintained.
    const timeout = window.setTimeout(callSubscribes, RESUBSCRIPTION_DELAY);

    // Unsubscribe from all topics passed into the hook when the component unmounts and clear the
    // timeout to prevent the second subscribe call.
    return () => {
      callRequestUnsubscribes();
      window.clearTimeout(timeout);
    };
  }, [handlers]);
};
