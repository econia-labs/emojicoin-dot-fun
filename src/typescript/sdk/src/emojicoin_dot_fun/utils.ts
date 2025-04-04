import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  isUserTransactionResponse,
  MoveString,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../const";
import { encodeEmojis, type SymbolEmoji } from "../emoji_data";
import type { JsonTypes } from "../types/json-types";
import { createNamedObjectAddress } from "../utils/aptos-utils";
import { type StructTagString, typeTagInputToStructName } from "../utils/type-tags";
import {
  arenaConverter,
  type ArenaEvents,
  type ArenaEventsWithIndices,
  createEmptyArenaEvents,
  isAnArenaStructName,
  toCamelCaseArenaEventName,
} from "./arena-events";
import {
  converter,
  createEmptyEvents,
  type Events,
  type EventsWithIndices,
  isAnEmojicoinStructName,
  toCamelCaseEventName,
} from "./events";

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
export function getMarketAddress(
  emojis: SymbolEmoji[],
  registryAddress?: AccountAddressInput
): AccountAddress {
  const creator = AccountAddress.from(registryAddress ?? REGISTRY_ADDRESS);
  const seed = encodeEmojis(emojis);
  return createNamedObjectAddress({
    creator,
    seed,
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

export const getEvents = (response?: UserTransactionResponse | PendingTransactionResponse | null) =>
  getEventsMaybeWithIndices(response, false);

export const getEventsWithIndices = (
  response?: UserTransactionResponse | PendingTransactionResponse | null
) => getEventsMaybeWithIndices(response, true);

function getEventsMaybeWithIndices(
  response: UserTransactionResponse | PendingTransactionResponse | null | undefined,
  withIndices?: false | undefined
): Events & ArenaEvents;
function getEventsMaybeWithIndices(
  response: UserTransactionResponse | PendingTransactionResponse | null | undefined,
  withIndices: true
): EventsWithIndices & ArenaEventsWithIndices;
function getEventsMaybeWithIndices(
  response: UserTransactionResponse | PendingTransactionResponse | null | undefined,
  withIndices: boolean = false
): (Events | EventsWithIndices) & (ArenaEvents | ArenaEventsWithIndices) {
  const events = {
    ...(createEmptyEvents() as EventsWithIndices),
    ...(createEmptyArenaEvents() as ArenaEventsWithIndices),
  };

  if (!response || !isUserTransactionResponse(response)) {
    return events;
  }

  response.events.forEach((event, eventIndex): void => {
    const structName = typeTagInputToStructName(event.type as StructTagString);
    if (!structName || (!isAnEmojicoinStructName(structName) && !isAnArenaStructName(structName))) {
      return;
    }

    // TypeScript can't infer or narrow the types properly below, but they're correct.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if (isAnEmojicoinStructName(structName)) {
      const data = converter[structName](event.data, response.version, response.sender);
      const camelCasedAndPlural = `${toCamelCaseEventName(structName)}s` as const;
      const eventData = withIndices ? { ...data, eventIndex } : data;
      events[camelCasedAndPlural].push(eventData as any);
    } else {
      const data = arenaConverter[structName](event.data, response.version, eventIndex);
      const camelCasedAndPlural = `${toCamelCaseArenaEventName(structName)}s` as const;
      const eventData = withIndices ? { ...data, eventIndex } : data;
      events[camelCasedAndPlural].push(eventData as any);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });
  return events;
}
