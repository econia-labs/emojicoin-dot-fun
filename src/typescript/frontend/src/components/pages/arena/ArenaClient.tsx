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
      <div>ID: {melee.arenaMelee.meleeId.toString()}</div>
      <div>
        {market0.market.symbolEmojis.join("")} vs {market1.market.symbolEmojis.join("")}
      </div>
    </div>
  );
};
