import { AccountAddress } from "@aptos-labs/ts-sdk";

export const ONE_APT = 1 * 10 ** 8;
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
export const MODULE_ADDRESS = (() =>
  AccountAddress.from((process.env.MODULE_ADDRESS ?? "").trim()))();
