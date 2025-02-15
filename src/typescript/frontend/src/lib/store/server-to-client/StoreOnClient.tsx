// cspell:word mkts
"use client";

import { EmojicoinArena } from "@/contract-apis";
import { type AccountInfo, useWallet, type WalletName } from "@aptos-labs/wallet-adapter-react";
import { ONE_APT } from "@sdk/const";
import { type SymbolEmoji } from "@sdk/emoji_data";
import { fetchAllCurrentMeleeData, toArenaCoinTypes } from "@sdk/markets";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { APTOS_NETWORK } from "lib/env";
import { cn } from "lib/utils/class-name";
import { Minus, X } from "lucide-react";
import { useCallback, useState } from "react";
import { ROUTES } from "router/routes";
import { emoji } from "utils";
import { Network } from "@aptos-labs/ts-sdk";

const iconClassName = "p-2 !text-white cursor-pointer !h-[40px] !w-[40px]";
const debugButtonClassName =
  "flex p-3 !text-white h-auto m-auto border border-sky-100 border-solid uppercase min-w-[15ch] hover:bg-dark-gray";

export const StoreOnClient = () => {
  const { account, connect, connected, wallet } = useWallet();
  const { aptos, forceRefetch, submit } = useAptos();
  const [showDebugger, setShowDebugger] = useState(false);
  const registeredMarkets = useEventStore((s) => s.markets);
  const handleCrank = (definedAccount: AccountInfo) => {
    // Use fire and water if on the local network, otherwise get the actual melee data.
    (APTOS_NETWORK === Network.LOCAL
      ? Promise.resolve([["🔥"], ["💧"]] as SymbolEmoji[][])
      : fetchAllCurrentMeleeData().then(({ market1, market2 }) => [
          market1.symbolEmojis,
          market2.symbolEmojis,
        ])
    ).then(([symbol1, symbol2]) => {
      const [c0, lp0, c1, lp1] = toArenaCoinTypes({ symbol1, symbol2 });
      EmojicoinArena.Enter.builder({
        aptosConfig: aptos.config,
        entrant: definedAccount.address,
        inputAmount: 1n,
        lockIn: false,
        // Mismatched but existing coin types to short-circuit the `enter` function if the crank isn't pulled.
        typeTags: [c0, lp1, c1, lp0, c0],
      })
        .then((builder) => builder.payloadBuilder.toInputPayload())
        .then(submit);
    });
  };

  // Curry a function to force a connection if the wallet isn't connected or call the original function otherwise.
  const forceConnectOrRunFunction = useCallback(
    (functionToCallIfConnected: (definedAccount: AccountInfo) => void) => () =>
      account && connected
        ? functionToCallIfConnected(account)
        : connect(wallet?.name ?? ("Petra" as WalletName)),
    [account, connect, connected, wallet]
  );

  return (
    <>
      <div className="fixed flex bottom-0 right-0 p-2 bg-black text-green text-xl">
        <div className="m-auto">{registeredMarkets.size} mkts</div>
      </div>
      <div className="flex flex-col gap-1 fixed top-0 left-0 z-[50] bg-black">
        {showDebugger ? (
          <X onClick={() => setShowDebugger((v) => !v)} className={iconClassName} />
        ) : (
          <Minus onClick={() => setShowDebugger((v) => !v)} className={iconClassName} />
        )}
        {showDebugger && (
          <>
            <button
              className={debugButtonClassName}
              onClick={forceConnectOrRunFunction((definedAccount) => {
                aptos
                  .fundAccount({
                    accountAddress: definedAccount.address,
                    amount: ONE_APT * 10000000,
                  })
                  .then(() => forceRefetch("apt"));
              })}
            >
              <span className="justify-start">
                {"Fund me"} {emoji("money bag")}
              </span>
            </button>
            <a className={cn(debugButtonClassName, "justify-start")} href={ROUTES["test-utils"]}>
              <span className="rotate-[-22.5deg]">{"/"}</span>
              <span className="lowercase">{"test-utils"}</span>
            </a>
            <button
              onClick={forceConnectOrRunFunction(handleCrank)}
              className={debugButtonClassName}
            >
              {"Crank melee"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default StoreOnClient;
