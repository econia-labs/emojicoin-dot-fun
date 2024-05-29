import { AccountAddress } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
import path from "path";
import { getGitRoot } from "./utils/git-root";

export const VERCEL = process.env.VERCEL === "1";
if (!VERCEL && typeof process === "object" && process.title.endsWith("node")) {
  const sdkPath = path.join(getGitRoot(), "src", "typescript", "sdk", ".env");
  dotenv.config({ path: sdkPath });
  const frontendPath = path.join(getGitRoot(), "src", "typescript", "frontend", ".env");
  dotenv.config({ path: frontendPath });
}

if (!process.env.NEXT_PUBLIC_MODULE_ADDRESS) {
  throw new Error("Missing NEXT_PUBLIC_MODULE_ADDRESS environment variable");
} else if (!process.env.INBOX_URL) {
  throw new Error("Missing INBOX_URL environment variable");
}
export const MODULE_ADDRESS = (() => AccountAddress.from(process.env.NEXT_PUBLIC_MODULE_ADDRESS))();
export const INBOX_URL = process.env.INBOX_URL!;

export const ONE_APT = 1 * 10 ** 8;
export const ONE_APTN = BigInt(ONE_APT);
export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
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

// For APT coin and for each emojicoin.
export const DECIMALS = 8;

// Emoji sequence length constraints.
export const MAX_CHAT_MESSAGE_LENGTH = 100;
export const MAX_SYMBOL_LENGTH = 10;

export enum CandlestickResolution {
  PERIOD_1S = 1000000,
  PERIOD_5S = 5000000,
  PERIOD_15S = 15000000,
  PERIOD_30S = 30000000,
  PERIOD_1M = 60000000,
  PERIOD_5M = 300000000,
  PERIOD_15M = 900000000,
  PERIOD_30M = 1800000000,
  PERIOD_1H = 3600000000,
  PERIOD_4H = 14400000000,
  PERIOD_1D = 864000000000,
}
