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
} from "@aptos-labs/ts-sdk";
import { EmojicoinDotFun, deriveEmojicoinPublisherAddress } from "../emojicoin_dot_fun";
import { type EmojicoinInfo } from "../types/contract";
import { toConfig } from "../utils/misc";
import { COIN_FACTORY_MODULE_NAME, DEFAULT_REGISTER_MARKET_GAS_OPTIONS } from "../const";

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
}): EmojicoinInfo {
  const registryAddress = AccountAddress.from(args.registryAddress);
  const symbolBytes = Hex.fromHexInput(args.symbolBytes);
  const marketAddress = deriveEmojicoinPublisherAddress({
    registryAddress,
    emojis: [symbolBytes.toStringWithoutPrefix()],
  });

  return {
    marketAddress,
    emojicoin: parseTypeTag(`${marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::Emojicoin`),
    emojicoinLP: parseTypeTag(
      `${marketAddress.toString()}::${COIN_FACTORY_MODULE_NAME}::EmojicoinLP`
    ),
  };
}

export const registerMarketAndGetEmojicoinInfo = async (args: {
  aptos: Aptos | AptosConfig;
  registryAddress: AccountAddressInput;
  emojis: Array<HexInput>;
  sender: Account;
  integrator: AccountAddressInput;
  options?: InputGenerateTransactionOptions;
}): Promise<EmojicoinInfo> => {
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

export const divideWithPrecision = (args: {
  a: bigint | number;
  b: bigint | number;
  decimals?: number;
}): number => {
  const decimals = args.decimals ?? 3;
  const a = BigInt(args.a);
  const b = BigInt(args.b);
  const f = BigInt(10 ** decimals);
  return Number((a * f) / b) / Number(f);
};

export const truncateAddress = (input: AccountAddressInput): string => {
  const t = AccountAddress.from(input);
  const s = t.toString();
  return `${s.substring(0, 6)}...${s.substring(s.length - 4, s.length)}`;
};
