import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  type UserTransactionResponse,
  MoveString,
  isUserTransactionResponse,
  type PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../const";
import {
  type Events,
  converter,
  createEmptyEvents,
  toCamelCaseEventName,
  isAnEmojicoinStructName,
} from "./events";
import { typeTagInputToStructName } from "../utils/type-tags";
import { createNamedObjectAddress } from "../utils/aptos-utils";
import type JsonTypes from "../types/json-types";
import { encodeEmojis, type SymbolEmoji } from "../emoji_data";

// Note that the conversion to string bytes below doesn't work if the length of the string is > 255.
const registryNameBytes = new MoveString("Registry").bcsToBytes().slice(1);
// Named object seed for the registry address.
export const REGISTRY_ADDRESS = createNamedObjectAddress({
  creator: MODULE_ADDRESS,
  seed: registryNameBytes,
});

/**
 * Derives the object address from the given emoji hex codes vector<u8> seed and
 * the given object creator.
 *
 * This is the address of the Object<Market> that publishes the coin type.
 */
export function deriveMarketAddress(
  emojis: SymbolEmoji[],
  registryAddress?: AccountAddressInput
): AccountAddress {
  const creator = AccountAddress.from(registryAddress ?? REGISTRY_ADDRESS);
  return createNamedObjectAddress({
    creator,
    seed: encodeEmojis(emojis),
  });
}

/**
 * Consider simply using the `REGISTRY_ADDRESS` derived constant value instead of this function, as
 * it mostly exists for e2e testing.
 *
 * @param args
 * @returns the on-chain registry address value
 */
export async function getRegistryAddress(args: {
  aptos: Aptos;
  moduleAddress: AccountAddressInput;
}): Promise<AccountAddress> {
  const { aptos } = args;
  const moduleAddress = AccountAddress.from(args.moduleAddress);
  const registryAddressResource = await aptos.getAccountResource<JsonTypes["RegistryAddress"]>({
    accountAddress: moduleAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::RegistryAddress`,
  });
  return AccountAddress.from(registryAddressResource.registry_address);
}

export function getEvents(
  response?: UserTransactionResponse | PendingTransactionResponse | null
): Events {
  const events = createEmptyEvents();
  if (!response || !isUserTransactionResponse(response)) {
    return events;
  }

  response.events.forEach((event): void => {
    const structName = typeTagInputToStructName(event.type);
    if (!structName || !isAnEmojicoinStructName(structName)) {
      return;
    }
    const data = converter[structName](event.data, response.version);
    const camelCasedAndPlural = `${toCamelCaseEventName(structName)}s` as const;
    // TypeScript can't infer or narrow the type. It's too difficult to figure out how to get it to
    // do it properly so we must use `as any` here, although we know for sure its type is correct.
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    events[camelCasedAndPlural].push(data as any);
  });
  return events;
}
