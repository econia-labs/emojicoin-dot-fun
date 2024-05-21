/* eslint-disable import/no-unused-modules */
import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  type TypeTag,
} from "@aptos-labs/ts-sdk";
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "../emojicoin_dot_fun/const";
import { type ContractTypes } from "./contract-types";

export type EmojicoinInfo = {
  marketAddress: AccountAddress;
  emojicoin: TypeTag;
  emojicoinLP: TypeTag;
};

export async function getMarketResource(args: {
  aptos: Aptos;
  moduleAddress: AccountAddressInput;
  objectAddress: AccountAddressInput;
}): Promise<ContractTypes.MarketResource> {
  const { aptos } = args;
  const moduleAddress = AccountAddress.from(args.moduleAddress);
  const objectAddress = AccountAddress.from(args.objectAddress);
  const marketResource = await aptos.getAccountResource<ContractTypes.MarketResource>({
    accountAddress: objectAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::Market`,
  });
  return marketResource;
}
