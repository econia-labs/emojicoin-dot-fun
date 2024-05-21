import {
  AccountAddress,
  type AccountAddressInput,
  Aptos,
  Hex,
  type HexInput,
  DeriveScheme,
  type AptosConfig,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "./const";
import { TYPE_TAGS } from "../types/type-tags";
import { type Events, converter, toGenericEvent } from "./events";
import { type ContractTypes } from "../types";

/**
 * Sleep the current thread for the given amount of time
 * @param timeMs time in milliseconds to sleep
 */
export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

export function toAptos(aptos: Aptos | AptosConfig): Aptos {
  return aptos instanceof Aptos ? aptos : new Aptos(aptos);
}

export function toConfig(aptos: Aptos | AptosConfig): AptosConfig {
  return aptos instanceof Aptos ? aptos.config : aptos;
}

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

export function createNamedObjectAddress(args: {
  creator: AccountAddressInput;
  seed: HexInput;
}): AccountAddress {
  const creatorAddress = AccountAddress.from(args.creator);
  const seed = Hex.fromHexInput(args.seed).toUint8Array();
  const serializedCreatorAddress = creatorAddress.bcsToBytes();
  const preImage = new Uint8Array([
    ...serializedCreatorAddress,
    ...seed,
    DeriveScheme.DeriveObjectAddressFromSeed,
  ]);

  return AccountAddress.from(sha3_256(preImage));
}

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
