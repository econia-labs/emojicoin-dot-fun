"use client";

import { useEventStore } from "context/websockets-context";
import { type DetailedMarketMetadata } from "lib/queries/types";
import { useEffect } from "react";

export type StoreOnClientProps = {
  markets: Array<DetailedMarketMetadata>;
};

export const StoreOnClient = ({ markets }: StoreOnClientProps) => {
  const initialize = useEventStore((s) => s.initializeMarketMetadata);

  useEffect(() => {
    initialize(markets);
  }, [initialize, markets]);

  return process.env.NODE_ENV === "development" ? (
    <div className="fixed flex bottom-0 right-0 p-2 bg-black text-green text-sm">
      <div className="m-auto">{markets.length} mkts</div>
    </div>
  ) : (
    <></>
  );
};

export default StoreOnClient;
