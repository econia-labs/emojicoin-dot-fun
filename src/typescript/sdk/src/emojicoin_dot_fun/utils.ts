import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  Hex,
  type UserTransactionResponse,
  MoveString,
} from "@aptos-labs/ts-sdk";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../const";
import { type Events, converter, toGenericEvent } from "./events";
import { type ContractTypes } from "../types";
import { TYPE_TAGS } from "../utils/type-tags";
import { createNamedObjectAddress } from "../utils/misc";

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
  const registryAddressResource = await aptos.getAccountResource({
    accountAddress: moduleAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::RegistryAddress`,
  });
  return registryAddressResource.registry_address;
}

export function getEvents(response: UserTransactionResponse): Events {
  const events: Events = {
    swapEvents: [],
    chatEvents: [],
    marketRegistrationEvents: [],
    periodicStateEvents: [],
    stateEvents: [],
    globalStateEvents: [],
    liquidityEvents: [],
    events: [],
  };

  response.events.forEach((event) => {
    if (!converter.has(event.type)) {
      const res = toGenericEvent(event);
      events.events.push(res);
    }
    const conversionFunction = converter.get(event.type)!;
    const data = conversionFunction(event);
    switch (event.type) {
      case TYPE_TAGS.SwapEvent.toString():
        events.swapEvents.push(data as ContractTypes.SwapEvent);
        break;
      case TYPE_TAGS.ChatEvent.toString():
        events.chatEvents.push(data as ContractTypes.ChatEvent);
        break;
      case TYPE_TAGS.MarketRegistrationEvent.toString():
        events.marketRegistrationEvents.push(data as ContractTypes.MarketRegistrationEvent);
        break;
      case TYPE_TAGS.PeriodicStateEvent.toString():
        events.periodicStateEvents.push(data as ContractTypes.PeriodicStateEvent);
        break;
      case TYPE_TAGS.StateEvent.toString():
        events.stateEvents.push(data as ContractTypes.StateEvent);
        break;
      case TYPE_TAGS.GlobalStateEvent.toString():
        events.globalStateEvents.push(data as ContractTypes.GlobalStateEvent);
        break;
      case TYPE_TAGS.LiquidityEvent.toString():
        events.liquidityEvents.push(data as ContractTypes.LiquidityEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.type}`);
    }
  });
  return events;
}
