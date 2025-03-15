export type Nominal<T, Name extends string> = T & {
  __brand: Name;
};

export type MarketID = Nominal<string, "MarketID">;
export type MeleeID = Nominal<string, "MeleeID">;
export type Address = Nominal<`0x${string}`, "Address">;
