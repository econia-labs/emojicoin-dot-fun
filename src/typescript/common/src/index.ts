export const ONE_APT = 1 * 10 ** 8;
export const ONE_APTN = BigInt(ONE_APT);

// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
export enum UnitOfTime {
  Microseconds,
  Milliseconds,
  Seconds,
  Minutes,
  Hours,
  Days,
  Weeks,
}

// No nanoseconds because dealing with overflow is a pain (aka using a bigint) and we don't need it.
// NOTE: This specifically for converting from a UnitOfTime to milliseconds.
export const UNIT_OF_TIME_MULTIPLIERS: Record<UnitOfTime, number> = {
  [UnitOfTime.Microseconds]: 1 / 1000,
  [UnitOfTime.Milliseconds]: 1,
  [UnitOfTime.Seconds]: 1000,
  [UnitOfTime.Minutes]: 1000 * 60,
  [UnitOfTime.Hours]: 1000 * 60 * 60,
  [UnitOfTime.Days]: 1000 * 60 * 60 * 24,
  [UnitOfTime.Weeks]: 1000 * 60 * 60 * 24 * 7,
};

/**
 * Sleep the current thread for the given amount of time, with an optional specifier
 * for the unit of time.
 *
 *
 * @param amount the numeric amount of time to sleep
 * @param unitOfTime the unit of time to sleep for
 * @default unitOfTime milliseconds.
 *
 */
export async function sleep(
  amount: number,
  unitOfTime: UnitOfTime = UnitOfTime.Milliseconds
): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, amount * UNIT_OF_TIME_MULTIPLIERS[unitOfTime]);
  });
}

export const MAX_GAS_FOR_PUBLISH = 1500000;
export const COIN_FACTORY_MODULE_NAME = "coin_factory";
export const EMOJICOIN_DOT_FUN_MODULE_NAME = "emojicoin_dot_fun";
export const REWARDS_MODULE_NAME = "emojicoin_dot_fun_rewards";
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
