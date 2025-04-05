import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { cache } from "react";

import {
  getAptosClient,
  isValidAptosName,
  removeLeadingZeros,
  type ValidAptosName,
} from "@/sdk/utils";

const INVALID_INPUT_RESULT = {
  address: undefined,
  name: undefined,
};

type PossibleResponses =
  | {
      // Input resolves to a valid ANS name, which means they have a valid address.
      address: `0x${string}`;
      name: ValidAptosName;
    }
  | {
      // Input resolves to a valid address but has no corresponding ANS name.
      address: `0x${string}`;
      name: undefined;
    }
  // Input is invalid. It's not an address or an Aptos name.
  | typeof INVALID_INPUT_RESULT;

const resolveOwnerName = async (input?: AccountAddressInput | null): Promise<PossibleResponses> => {
  if (!input) return INVALID_INPUT_RESULT;

  const aptos = getAptosClient();

  try {
    if (isValidAptosName(input)) {
      const name = input;
      const address = await aptos.ans.getOwnerAddress({ name }).then((res) => res?.toString());
      if (address) {
        return {
          address,
          name,
        };
      }
    }

    if (AccountAddress.isValid({ input }).valid) {
      const address = AccountAddress.from(input);
      const name = await aptos.ans.getPrimaryName({ address });
      return {
        address: address.toString(),
        name: name ? (name as ValidAptosName) : undefined,
      };
    }
  } catch (e) {
    if (isValidAptosName(input) || AccountAddress.isValid({ input })) {
      // The ANS service is either down or the user is on a local network. Just return the address
      // if it's a valid account address.
      console.warn(`${input} is a valid ANS name or account address but still threw an error ${e}`);
      return {
        address: AccountAddress.isValid({ input }).valid
          ? AccountAddress.from(input).toString()
          : undefined,
        name: undefined,
      };
    }
  }

  return INVALID_INPUT_RESULT;
};

/**
 * This function resolves to the most specific name possible for an input owner address or name.
 * If the input isn't a valid account address or a valid name, only the input is returned.
 *
 * NOTE: This function lazily fetches Aptos names by pre-validating with {@link isValidAptosName}.
 *
 * NOTE: React's `cache` function essentially memoizes fetches on a per-request basis. This fetch is
 *       used in the generateMetadata function and in the page.tsx body, so caching it per-request
 *       saves us an extra fetch.
 *       We don't want to cache it beyond that because it would take up storage space.
 *
 * @returns a potential address, a potential valid Aptos name, and always the original input
 * @see {@link PossibleResponses}
 */
export const resolveOwnerNameCached = cache(resolveOwnerName);

const MAX_CHARS_IN_ADDRESS = 6;
export const customTruncateAddress = (addr: AccountAddressInput) => {
  const res = removeLeadingZeros(addr);
  if (res.length > MAX_CHARS_IN_ADDRESS) {
    return `0x${res.substring(2, MAX_CHARS_IN_ADDRESS)}...` as const;
  }
  return res;
};
