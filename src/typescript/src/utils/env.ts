import "dotenv";

if (!process.env.COIN_FACTORY_MODULE_NAME) {
  throw new Error("COIN_FACTORY_MODULE_NAME is required");
} else if (!process.env.EMOJICOIN_DOT_FUN_MODULE_NAME) {
  throw new Error("EMOJICOIN_DOT_FUN_MODULE_NAME is required");
}

export const { COIN_FACTORY_MODULE_NAME } = process.env;
export const { EMOJICOIN_DOT_FUN_MODULE_NAME } = process.env;
