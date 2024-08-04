import { useEventStore } from "context/state-store-context";
import { generateRandomEvent, type RandomEventArgs } from "./event-generator";

export const useGenerateEvent = (args: RandomEventArgs & { stateOnly?: boolean }) => {
  const pushEvent = useEventStore((s) => s.pushEventFromClient);

  const { triggeringEvent, stateEvent } = generateRandomEvent(args);

  return () => {
    pushEvent(stateEvent);
    if (!args.stateOnly) {
      pushEvent(triggeringEvent);
    }
  };
};
