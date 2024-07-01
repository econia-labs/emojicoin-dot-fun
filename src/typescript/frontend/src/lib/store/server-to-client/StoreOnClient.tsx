"use client";
// cspell:word mkts

import { MODULE_ADDRESS } from "@sdk/const";
import { CloseIconWithHover } from "components/svg";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { type DetailedMarketMetadata } from "lib/queries/types";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type StoreOnClientProps = {
  markets: Array<DetailedMarketMetadata>;
};

export const StoreOnClient = ({ markets }: StoreOnClientProps) => {
  const initialize = useEventStore((s) => s.initializeMarketMetadata);
  const storeMarkets = useEventStore((s) => s.markets);
  const subscriptions = useWebSocketClient((s) => s.subscriptions);
  const pathname = usePathname();
  const [showDebugger, setShowDebugger] = useState(false);

  const [events, setEvents] = useState(storeMarkets.get(pathname.split("/market/")?.[1] ?? ""));
  useEffect(() => {
    setEvents(storeMarkets.get(pathname.split("/market/")?.[1]));
  }, [pathname, storeMarkets]);

  // useEffect(() => {
  //   console.debug(events);
  // }, [events]);

  useEffect(() => {
    initialize(markets);
  }, [initialize, markets]);

  return process.env.NODE_ENV === "development" ? (
    <>
      <div className="fixed flex bottom-0 right-0 p-2 bg-black text-green text-xl">
        <div className="m-auto">{markets.length} mkts</div>
      </div>

      <CloseIconWithHover
        className="fixed top-0 left-0 p-2 !text-white cursor-pointer !h-[40px] !w-[40px] z-[50]"
        onClick={() => setShowDebugger((v) => !v)}
      />
      {showDebugger && subscriptions && (
        <div
          className={
            "fixed flex flex-col top-0 left-0 bg-transparent " +
            "text-xl max-h-[500px] w-[600px] overflow-x-clip overflow-y-scroll z-[49] " +
            "border-white border-solid border"
          }
        >
          <div className="mt-[36px]">
            {Array.from(subscriptions.keys()).map((sub) => {
              return (
                <div key={sub} className="relative left-[3ch] flex flex-row items-center bg-black">
                  <div className="text-green">{"subscription:"}&nbsp;</div>
                  <div className="text-white">
                    {sub.replace(MODULE_ADDRESS.toString(), "0xbabe...d00d")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  ) : (
    <></>
  );
};

export default StoreOnClient;
