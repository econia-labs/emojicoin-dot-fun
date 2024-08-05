import { useEventStore } from "context/state-store-context";
import { generateRandomEvent, type RandomEventArgs } from "./event-generator";

/**
 * Use this hook to generate a random event and store it in state on the client.
 * We can use this to drive and debug animations for visual testing purposes.
 */
export const useGenerateEvent = (args: RandomEventArgs & { stateOnly?: boolean }) => {
  const pushEvent = useEventStore((s) => s.pushEventFromClient);

  const { triggeringEvent, stateEvent } = generateRandomEvent({ ...args, emojis: undefined });

  return () => {
    pushEvent(stateEvent);
    if (!args.stateOnly) {
      pushEvent(triggeringEvent);
    }
  };
};
