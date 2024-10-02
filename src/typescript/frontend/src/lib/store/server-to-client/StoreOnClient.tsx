"use client";
import { useWallet, type WalletName } from "@aptos-labs/wallet-adapter-react";
// cspell:word mkts

import { ONE_APT } from "@sdk/const";
import { CloseIconWithHover } from "components/svg";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const StoreOnClient = () => {
  const { account, connect, connected, wallet } = useWallet();
  const { aptos, forceRefetch } = useAptos();
  const storeMarkets = useEventStore((s) => s.markets);
  const subscriptions = useEventStore((s) => s.subscriptions);
  const pathname = usePathname();
  const [showDebugger, setShowDebugger] = useState(false);
  const registeredMarkets = useEventStore((s) => s.markets);

  const [_events, setEvents] = useState(storeMarkets.get(pathname.split("/market/")?.[1] ?? ""));

  useEffect(() => {
    setEvents(storeMarkets.get(pathname.split("/market/")?.[1]));
  }, [pathname, storeMarkets]);

  return (
    <>
      <div className="fixed flex bottom-0 right-0 p-2 bg-black text-green text-xl">
        <div className="m-auto">{registeredMarkets.size} mkts</div>
      </div>

      <div className="flex flex-col gap-1 fixed top-0 left-0 z-[50]">
        <CloseIconWithHover
          className="p-2 !text-white cursor-pointer !h-[40px] !w-[40px]"
          onClick={() => setShowDebugger((v) => !v)}
        />
        {showDebugger && subscriptions && (
          <div
            className={
              "fixed flex flex-col top-0 left-0 bg-transparent " +
              "text-xl max-h-[500px] w-[600px] overflow-x-clip overflow-y-scroll " +
              "border-white border-solid border"
            }
          >
            <div className="mt-[36px]">
              <div className="relative left-[3ch] flex flex-row items-center bg-black">
                <div className="text-green">
                  {"marketIDs:"}&nbsp;{Array.from(subscriptions.marketIDs).join(", ")}
                </div>
                <div className="text-green">
                  {"eventTypes:"}&nbsp;{Array.from(subscriptions.eventTypes).join(", ")}
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          className="p-3 !text-white h-auto w-auto m-auto border border-sky-100 border-solid uppercase"
          onClick={async () => {
            if (!account || !connected) {
              if (wallet) {
                connect("Petra" as WalletName);
              } else {
                try {
                  connect("Petra" as WalletName);
                } catch (e) {
                  try {
                    connect("Connect with Google" as WalletName);
                  } catch (e) {
                    alert("No valid wallet to connect to.");
                  }
                }
              }
            } else {
              await aptos.fundAccount({
                accountAddress: account.address,
                amount: ONE_APT * 10000000,
              });
              forceRefetch("apt");
            }
          }}
        >
          {"Fund me 💰"}
        </button>
      </div>
    </>
  );
};

export default StoreOnClient;
