import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  AnyNumber,
  type Aptos,
  type AptosConfig,
  Hex,
  type HexInput,
  type InputGenerateTransactionOptions,
  parseTypeTag,
  type TypeTag,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import Big from "big.js";
import {
  EmojicoinDotFun,
  REGISTRY_ADDRESS,
  deriveEmojicoinPublisherAddress,
} from "../emojicoin_dot_fun";
import { toConfig } from "../utils/aptos-utils";
import {
  COIN_FACTORY_MODULE_NAME,
  DEFAULT_REGISTER_MARKET_GAS_OPTIONS,
  GRACE_PERIOD_TIME,
  Period,
  rawPeriodToEnum,
} from "../const";
import {
  type Types,
  toMarketResource,
  toRegistrantGracePeriodFlag,
  toRegistryResource,
} from "../types/types";
import type JsonTypes from "../types/json-types";
import {
  type DerivedEmojicoinData,
  type EmojicoinSymbol,
  encodeEmojis,
  symbolBytesToEmojis,
  type SymbolEmojiData,
} from "../emoji_data";
import { STRUCT_STRINGS, TYPE_TAGS } from "../utils";

export function toCoinTypes(inputAddress: AccountAddressInput): {
  emojicoin: TypeTag;
  emojicoinLP: TypeTag;
} {
  const marketAddress = AccountAddress.from(inputAddress);

  return {
    emojicoin: parseTypeTag(`${marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::Emojicoin`),
    emojicoinLP: parseTypeTag(
      `${marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::EmojicoinLP`
    ),
  };
}

/**
 * Get the derived market address and TypeTags for the given registry address and symbol bytes.
 *
 * @param registryAddress The contract's registry address.
 * @param symbolBytes The emojicoin's full symbol bytes.
 * @returns The derived market address and TypeTags.
 */
export function getEmojicoinMarketAddressAndTypeTags(args: {
  registryAddress?: AccountAddressInput;
  symbolBytes: HexInput;
}): Types["EmojicoinInfo"] {
  const registryAddress = AccountAddress.from(args.registryAddress ?? REGISTRY_ADDRESS);
  const symbolBytes = Hex.fromHexInput(args.symbolBytes);
  const emojis = symbolBytesToEmojis(symbolBytes.toUint8Array());
  const marketAddress = deriveEmojicoinPublisherAddress({
    registryAddress,
    emojis: emojis.emojis.map((e) => e.hex),
  });

  const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);

  return {
    marketAddress,
    emojicoin,
    emojicoinLP,
  };
}

/**
 * Helper function to get all emoji data based from a symbol.
 *
 * Note that the market metadata is implicitly derived from the hardcoded module address constant.
 */
export const getEmojicoinData = (symbol: EmojicoinSymbol): DerivedEmojicoinData => {
  const symbolArray = Array.isArray(symbol)
    ? symbol
    : ([symbol] as Array<string> | Array<SymbolEmojiData>);
  const symbolBytes = encodeEmojis(symbolArray);
  const data = symbolBytesToEmojis(symbolBytes);
  const metadata = getEmojicoinMarketAddressAndTypeTags({ symbolBytes });
  return {
    ...data,
    ...metadata,
    symbolBytes,
  };
};

/**
 * Fetches the market grace period from the registry resource based on the market `symbol` input.
 *
 * @param aptos the Aptos client
 * @param symbol the market symbol
 * @param registryAddress the registry address, uses environment vars if absent
 *
 * @returns If the market doesn't exist, the function returns `null` for the grace period flag and
 * grace period over.
 *
 * If the market exists, the function returns the grace period flag and whether the grace period is
 * over. If the grace period flag is `null`, the grace period is over, but we also mark it as over
 * more explicitly with the `gracePeriodOver` field.
 *
 * If the market exists and has a flag, we explicitly check if the grace period is over by comparing
 * the current time with the registration time and grace period end in case there is a slight delay
 * between the fetched indexer value and the on-chain value.
 */
export async function getRegistrationGracePeriodFlag(args: {
  aptos: Aptos;
  symbol: string;
  registryAddress?: AccountAddressInput;
}): Promise<
  | { marketNotFound: true; flag: null; gracePeriodOver: null }
  | {
      marketNotFound: false;
      flag: Types["RegistrantGracePeriodFlag"] | null;
      gracePeriodOver: boolean;
    }
> {
  const { aptos, symbol } = args;
  const registryAddress = AccountAddress.from(args.registryAddress ?? REGISTRY_ADDRESS);
  const textEncoder = new TextEncoder();
  const symbolBytes = textEncoder.encode(symbol);
  const { marketAddress } = getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes,
  });
  let gracePeriodJSONResource: JsonTypes["RegistrantGracePeriodFlag"] | undefined;
  try {
    const accountResources = await aptos.getAccountResources({
      accountAddress: marketAddress,
    });
    const hasMarketResource =
      typeof accountResources.find(
        (r) => parseTypeTag(r.type).toString() === STRUCT_STRINGS.Market
      ) !== "undefined";
    if (!hasMarketResource) {
      // If the account doesn't have a `Market` resource, the market doesn't exist and will have
      // no flag and thus no grace period.
      return {
        marketNotFound: true,
        flag: null,
        gracePeriodOver: null,
      };
    }
    gracePeriodJSONResource = accountResources.find(
      (r) => parseTypeTag(r.type).toString() === STRUCT_STRINGS.RegistrantGracePeriodFlag
    )?.data as JsonTypes["RegistrantGracePeriodFlag"];
    if (gracePeriodJSONResource) {
      const gracePeriodFlag = toRegistrantGracePeriodFlag(gracePeriodJSONResource);
      // We've found the market, got a flag, and can check if the grace period is over.
      return {
        marketNotFound: false,
        flag: gracePeriodFlag,
        // Although we know that the grace period shouldn't be over if we can find the flag (because
        // it's removed as soon as the period is over), there is a slight delay between the indexer
        // checking for the resource and the on-chain value. Thus, to be sure, we can account for
        // the edge case where the grace period has ended while fetching by checking the
        // registration time and grace period end directly.
        gracePeriodOver: isRegistrationGracePeriodOver(gracePeriodFlag),
      };
    }
    // If the account has a `Market` resource but no grace period flag, we know for sure that the
    // grace period is over.
    return {
      marketNotFound: false,
      flag: null,
      gracePeriodOver: true,
    };
  } catch (e) {
    console.error(
      `Failed to fetch account resources for market address: ${marketAddress}. Error: ${e}`
    );
    return {
      marketNotFound: true,
      flag: null,
      gracePeriodOver: null,
    };
  }
}

export function isRegistrationGracePeriodOver(flag: Types["RegistrantGracePeriodFlag"]): boolean {
  const now = BigInt(new Date().getTime()) * 1000n;
  return now - GRACE_PERIOD_TIME > flag.marketRegistrationTime;
}

export const registerMarketAndGetEmojicoinInfo = async (args: {
  aptos: Aptos | AptosConfig;
  registryAddress: AccountAddressInput;
  emojis: Array<HexInput>;
  sender: Account;
  integrator: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<Types["EmojicoinInfo"]> => {
  const { aptos, emojis, sender, integrator } = args;
  const aptosConfig = toConfig(aptos);
  const options = args.options || DEFAULT_REGISTER_MARKET_GAS_OPTIONS;
  const res = await EmojicoinDotFun.RegisterMarket.submit({
    aptosConfig,
    registrant: sender,
    emojis,
    integrator,
    options,
  });

  if (!res.success) {
    throw new Error(`Failed to register market: ${res.vm_status}, \nHash: ${res.hash}`);
  }

  const registryAddress = AccountAddress.from(args.registryAddress);
  const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
    registryAddress,
    symbolBytes: emojis.map((v) => Hex.fromHexInput(v).toStringWithoutPrefix()).join(""),
  });

  return { marketAddress, emojicoin, emojicoinLP };
};

export async function getMarketResource(args: {
  aptos: Aptos;
  marketAddress: AccountAddressInput;
  ledgerVersion?: AnyNumber;
}): Promise<Types["Market"]> {
  const { aptos, ledgerVersion } = args;
  const marketAddress = AccountAddress.from(args.marketAddress);
  const marketResource = await aptos.getAccountResource<JsonTypes["Market"]>({
    accountAddress: marketAddress,
    resourceType: STRUCT_STRINGS.Market,
    options: {
      ledgerVersion,
    },
  });

  return toMarketResource(marketResource);
}

export function getMarketResourceFromWriteSet(
  response: UserTransactionResponse,
  marketAddress: AccountAddressInput
) {
  return getResourceFromWriteSet({
    response,
    resourceTypeTag: TYPE_TAGS.Market,
    writeResourceAddress: marketAddress,
    convert: toMarketResource,
  });
}

export function getRegistryResourceFromWriteSet(response: UserTransactionResponse) {
  return getResourceFromWriteSet({
    response,
    resourceTypeTag: TYPE_TAGS.Registry,
    writeResourceAddress: REGISTRY_ADDRESS,
    convert: toRegistryResource,
  });
}

export function getResourceFromWriteSet<T, U>(args: {
  response: UserTransactionResponse;
  resourceTypeTag: TypeTag;
  writeResourceAddress: AccountAddressInput;
  convert: (data: T) => U;
}): U | undefined {
  const { writeResourceAddress, resourceTypeTag, response, convert } = args;
  const { changes } = response;
  const changedAddress = AccountAddress.from(writeResourceAddress);
  let resource: T | undefined;
  changes.find((someChange) => {
    if (someChange.type !== "write_resource") return false;
    const change = someChange as WriteSetChangeWriteResource;

    const { address } = change as WriteSetChangeWriteResource;
    if (!changedAddress.equals(AccountAddress.from(address))) return false;

    const resourceType = (change as WriteSetChangeWriteResource).data.type;
    const typeTag = parseTypeTag(resourceType).toString();
    if (typeTag !== resourceTypeTag.toString()) return false;

    resource = change.data.data as T;
    return true;
  });

  if (typeof resource !== "undefined") {
    return convert(resource);
  }
  return undefined;
}

export function calculateTvlGrowth(periodicStateTracker1D: Types["PeriodicStateTracker"]) {
  if (rawPeriodToEnum(periodicStateTracker1D.period) !== Period.Period1D) {
    throw new Error("Expected a 1-day Periodic State Tracker to calculate TVL growth.");
  }

  const { coinRatioStart: start, coinRatioEnd: end } = periodicStateTracker1D;

  const a = Big(start.tvl.toString());
  const b = Big(start.lpCoins.toString());
  const c = Big(end.tvl.toString());
  const d = Big(end.lpCoins.toString());

  if (a.eq(0) || b.eq(0)) {
    return "0";
  }

  // (b * c) / (a * d)
  return b.mul(c).div(a.mul(d)).toString();
}
