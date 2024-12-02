import { useNameStore } from "context/event-store-context/hooks";
import { useEffect, useMemo } from "react";

/**
 * Resolves an address to a name by calling `resolveAddress` every time the input param `address`
 * changes. If the promise already exists, the promise map in `name-store.ts` won't create another
 * one.
 *
 * When the promise resolves, the `addressName` from `state.names` in the NameStore will update
 * accordingly, and thus the value returned from this hook will change and issue a re-render for
 * any component using this hook with that specific, newly updated address.
 *
 *
 * @param address the input address to resolve.
 * @returns a resolved name, either the ANS name or the address itself if there is no name or if the
 * promise is resolving.
 */
export function useNameResolver(address: string | null | undefined): string {
  const resolveAddress = useNameStore((s) => s.resolveAddress);
  const addressWithDefault = useMemo(() => address ?? "", [address]);
  const addressName = useNameStore(
    (s) => s.names.get(addressWithDefault)?.name ?? addressWithDefault
  );

  useEffect(() => {
    if (address) {
      resolveAddress(address);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return addressName;
}
