import { Hex } from "@aptos-labs/ts-sdk";

export const ONE_APT = 1 * 10 ** 8;
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";

// This scheme identifier is specified here:
/* eslint-disable-next-line max-len */
// https://github.com/aptos-labs/aptos-core//blob/7647a942dbb444af879caf5833d695feee91a763/aptos-move/framework/aptos-framework/sources/object.move#L87
export const OBJECT_FROM_SEED_ADDRESS_SCHEME = Hex.fromHexString("0xFE");
