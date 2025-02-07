"use client";

import type { ArenaMeleeModel, MarketStateModel } from "@sdk/indexer-v2/types";

export const ArenaClient = ({
  melee,
  market0,
  market1,
}: {
  melee: ArenaMeleeModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
}) => {
  return (
    <div className="flex flex-col gap-[1em] text-ec-blue">
      <div>ID: {melee.melee.meleeID.toString()}</div>
      <div>
        {market0.market.symbolData.symbol} vs {market1.market.symbolData.symbol}
      </div>
    </div>
  );
};
