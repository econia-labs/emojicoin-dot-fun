import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  type AptosConfig,
  Hex,
  type HexInput,
  type InputGenerateTransactionOptions,
  parseTypeTag,
  type TypeTag,
} from "@aptos-labs/ts-sdk";
import { EmojicoinDotFun, deriveEmojicoinPublisherAddress } from "../emojicoin_dot_fun";
import { toConfig } from "../utils/aptos-utils";
import { COIN_FACTORY_MODULE_NAME, DEFAULT_REGISTER_MARKET_GAS_OPTIONS, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../const";
import { Types, toMarketResource } from "../types/types";
import JSONTypes from "../types/json-types";

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
  registryAddress: AccountAddressInput;
  symbolBytes: HexInput;
}): Types.EmojicoinInfo {
  const registryAddress = AccountAddress.from(args.registryAddress);
  const symbolBytes = Hex.fromHexInput(args.symbolBytes);
  const marketAddress = deriveEmojicoinPublisherAddress({
    registryAddress,
    emojis: [symbolBytes.toStringWithoutPrefix()],
  });

  const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);

  return {
    marketAddress,
    emojicoin,
    emojicoinLP,
  };
}

export const registerMarketAndGetEmojicoinInfo = async (args: {
  aptos: Aptos | AptosConfig;
  registryAddress: AccountAddressInput;
  emojis: Array<HexInput>;
  sender: Account;
  integrator: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<Types.EmojicoinInfo> => {
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
  moduleAddress: AccountAddressInput;
  objectAddress: AccountAddressInput;
}): Promise<Types.MarketResource> {
  const { aptos } = args;
  const moduleAddress = AccountAddress.from(args.moduleAddress);
  const objectAddress = AccountAddress.from(args.objectAddress);
  const marketResource = await aptos.getAccountResource<JSONTypes.MarketResource>({
    accountAddress: objectAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::Market`,
  });

  return toMarketResource(marketResource);
}
