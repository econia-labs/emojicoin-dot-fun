export type Nominal<T, Name extends string> = T & {
  __brand: Name;
};

export type MarketID = Nominal<string, "MarketID">;
export type MeleeID = Nominal<string, "MeleeID">;
export type StandardizedAddress = Nominal<`0x${string}`, "ValidAccountAddress">;
