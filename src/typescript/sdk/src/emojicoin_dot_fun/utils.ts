import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  Hex,
  type UserTransactionResponse,
  MoveString,
  isUserTransactionResponse,
  type PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../const";
import { type Events, converter, toGenericEvent, createEmptyEvents } from "./events";
import {
  type AnyEmojicoinEvent,
  type AnyEmojicoinEventName,
  type Types,
} from "../types";
import { TYPE_TAGS } from "../utils/type-tags";
import { createNamedObjectAddress } from "../utils/aptos-utils";
import JSONTypes, { type AnyEmojicoinJSONEvent } from "../types/json-types";
import { type AccountAddressString } from "./types";

/**
 * Derives the object address from the given emoji hex codes vector<u8> seed and
 * the given object creator.
 */
export function deriveEmojicoinPublisherAddress(args: {
  registryAddress: AccountAddress;
  emojis: Array<string>;
}): AccountAddress {
  const { emojis, registryAddress } = args;
  const hexStringBytes = emojis
    .map((emoji) => Hex.fromHexString(emoji).toStringWithoutPrefix())
    .join("");
  const seed = Hex.fromHexString(hexStringBytes).toUint8Array();
  return createNamedObjectAddress({
    creator: registryAddress,
    seed,
  });
}

// Note that the conversion to string bytes below doesn't work if the length of the string is > 255.
const registryNameBytes = new MoveString("Registry").bcsToBytes().slice(1);
// Named object seed for the registry address.
export const REGISTRY_ADDRESS = createNamedObjectAddress({
  creator: MODULE_ADDRESS,
  seed: registryNameBytes,
});

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
  const registryAddressResource = await aptos.getAccountResource<JSONTypes.RegistryAddress>({
    accountAddress: moduleAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::RegistryAddress`,
  });
  return AccountAddress.from(registryAddressResource.registry_address);
}

export interface DBJsonData<T extends AnyEmojicoinJSONEvent> {
  account_address: string;
  creation_number: string;
  data: T;
  transaction_version: number;
  transaction_block_height: number;
  type: `0x${string}::${string}::${string}`;
  event_index: number;
  event_name: `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::${string}`;
  inserted_at: null;
  sequence_number: number;
}

export type DeserializedEventData = {
  address: AccountAddressString;
  data: AnyEmojicoinEvent;
  type: AnyEmojicoinEventName;
  version: number;
};

// TODO: Add support for MarketDataView and any other non-event types.
export function deserializeBufferedEvent<T extends AnyEmojicoinEvent>(data: Buffer) {
  const msg = data.toString();
  const json = JSON.parse(msg);
  return webSocketJsonToEvent<T>(json);
}

export function webSocketJsonToEvent<T extends AnyEmojicoinEvent>(
  event: DBJsonData<AnyEmojicoinJSONEvent>
): DeserializedEventData | undefined {
  const fn = converter.get(event.type);
  if (fn) {
    return {
      address: AccountAddress.from(event.account_address).toString(),
      data: fn(event.data, event.transaction_version) as T,
      type: event.event_name as AnyEmojicoinEventName,
      version: event.transaction_version,
    };
  }
  return undefined;
}

export function getEvents(
  response?: UserTransactionResponse | PendingTransactionResponse | null
): Events {
  const events = createEmptyEvents();
  if (!response || !isUserTransactionResponse(response)) {
    return events;
  }

  response.events.forEach((event): void => {
    if (!converter.has(event.type)) {
      const res = toGenericEvent(event);
      events.genericEvents.push(res);
      return;
    }
    const conversionFunction = converter.get(event.type)!;
    const data = conversionFunction(event.data, Number(response.version));
    switch (event.type) {
      case TYPE_TAGS.SwapEvent.toString():
        events.swapEvents.push(data as Types.SwapEvent);
        break;
      case TYPE_TAGS.ChatEvent.toString():
        events.chatEvents.push(data as Types.ChatEvent);
        break;
      case TYPE_TAGS.MarketRegistrationEvent.toString():
        events.marketRegistrationEvents.push(data as Types.MarketRegistrationEvent);
        break;
      case TYPE_TAGS.PeriodicStateEvent.toString():
        events.periodicStateEvents.push(data as Types.PeriodicStateEvent);
        break;
      case TYPE_TAGS.StateEvent.toString():
        events.stateEvents.push(data as Types.StateEvent);
        break;
      case TYPE_TAGS.GlobalStateEvent.toString():
        events.globalStateEvents.push(data as Types.GlobalStateEvent);
        break;
      case TYPE_TAGS.LiquidityEvent.toString():
        events.liquidityEvents.push(data as Types.LiquidityEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  });
  return events;
}
