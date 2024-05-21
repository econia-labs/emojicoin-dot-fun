import { AccountAddress } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file if we're not running in CI/CD or
// from Vercel.
const GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === "true";
const VERCEL = process.env.VERCEL === "1";
const inActionsOrVercel = GITHUB_ACTIONS || VERCEL;
if (!inActionsOrVercel) {
  const envPath = path.join(__dirname, "..", "..", ".env");
  dotenv.config({ path: envPath });
}

export const ONE_APT = 1 * 10 ** 8;
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
export const MODULE_ADDRESS = AccountAddress.from(
  "0x4bab58978ec1b1bef032eeb285ad47a6a9b997d646c19b598c35f46b26ff9ece"
);
export const INBOX_URL = process.env.INBOX_URL!;
export const DEFAULT_REGISTER_MARKET_GAS_OPTIONS = {
  maxGasAmount: ONE_APT / 100,
  gasUnitPrice: 100,
};
export const MARKET_CAP = 4_500_000_000_000n;
export const EMOJICOIN_REMAINDER = 10_000_000_000_000_000n;
export const EMOJICOIN_SUPPLY = 45_000_000_000_000_000n;
export const LP_TOKENS_INITIAL = 100_000_000_000_000n;
export const BASE_REAL_FLOOR = 0n;
export const QUOTE_REAL_FLOOR = 0n;
export const BASE_REAL_CEILING = 35_000_000_000_000_000n;
export const QUOTE_REAL_CEILING = 1_000_000_000_000n;
export const BASE_VIRTUAL_FLOOR = 14_000_000_000_000_000n;
export const QUOTE_VIRTUAL_FLOOR = 400_000_000_000n;
export const BASE_VIRTUAL_CEILING = 49_000_000_000_000_000n;
export const QUOTE_VIRTUAL_CEILING = 1_400_000_000_000n;
export const POOL_FEE_RATE_BPS = 25;
export const MARKET_REGISTRATION_FEE = 100_000_000n;

// For the emoji coin.
export const DECIMALS = 8;

// Emoji sequence length constraints.
export const MAX_CHAT_MESSAGE_LENGTH = 100;
export const MAX_SYMBOL_LENGTH = 10;

export enum CandlestickResolution {
  PERIOD_1M = "60000000",
  PERIOD_5M = "300000000",
  PERIOD_15M = "900000000",
  PERIOD_30M = "1800000000",
  PERIOD_1H = "3600000000",
  PERIOD_4H = "14400000000",
  PERIOD_1D = "86400000000",
}
