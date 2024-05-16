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
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "./consts";
import {
  ChatEvent,
  Event,
  type Events,
  GlobalStateEvent,
  LiquidityEvent,
  MarketRegistrationEvent,
  PeriodicStateEvent,
  StateEvent,
  SwapEvent,
} from "./events";

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

  response.events.forEach((eventData) => {
    const event = Event.from(eventData);
    switch (event.type.toString()) {
      case SwapEvent.STRUCT_STRING:
        events.swapEvents.push(event as SwapEvent);
        break;
      case ChatEvent.STRUCT_STRING:
        events.chatEvents.push(event as ChatEvent);
        break;
      case MarketRegistrationEvent.STRUCT_STRING:
        events.marketRegistrationEvents.push(event as MarketRegistrationEvent);
        break;
      case PeriodicStateEvent.STRUCT_STRING:
        events.periodicStateEvents.push(event as PeriodicStateEvent);
        break;
      case StateEvent.STRUCT_STRING:
        events.stateEvents.push(event as StateEvent);
        break;
      case GlobalStateEvent.STRUCT_STRING:
        events.globalStateEvents.push(event as GlobalStateEvent);
        break;
      case LiquidityEvent.STRUCT_STRING:
        events.liquidityEvents.push(event as LiquidityEvent);
        break;
      default:
        events.events.push(event as Event);
        break;
    }
  });
  return events;
}
