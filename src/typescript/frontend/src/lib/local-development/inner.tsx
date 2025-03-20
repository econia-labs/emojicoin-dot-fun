// cspell:word mkts
"use client";

import {
  EmojicoinArena,
  MarketMetadataByMarketAddress,
  RegisterMarket,
  Swap,
} from "@/contract-apis";
import { type AccountInfo, useWallet, type WalletName } from "@aptos-labs/wallet-adapter-react";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS, ONE_APT } from "@sdk/const";
import { fetchAllCurrentMeleeData, toArenaCoinTypes, toCoinTypesForEntry } from "@sdk/markets";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { APTOS_NETWORK } from "lib/env";
import { cn } from "lib/utils/class-name";
import { Minus, X } from "lucide-react";
import { useCallback, useState } from "react";
import { ROUTES } from "router/routes";
import { emoji } from "utils";
import { Network } from "@aptos-labs/ts-sdk";
import { successfulTransactionToast } from "@/components/wallet/toasts";
import { toast } from "react-toastify";
import { getAptosClient } from "@sdk/utils";
import { getEvents, getMarketAddress } from "@sdk/emojicoin_dot_fun";
import { encodeEmojis, type SymbolEmoji } from "@sdk/emoji_data";
import { getLocalPublisher } from "@/components/pages/test-utils/local-publisher";
import FEATURE_FLAGS from "lib/feature-flags";

const iconClassName = "p-2 !text-white cursor-pointer !h-[40px] !w-[40px]";
const debugButtonClassName =
  "flex p-3 !text-white h-auto m-auto border border-sky-100 border-solid uppercase min-w-[15ch] hover:bg-dark-gray";

export const InnerDisplayDebugData = () => {
  const { account, connect, connected, wallet } = useWallet();
  const { aptos, forceRefetch, submit } = useAptos();
  const [showDebugger, setShowDebugger] = useState(false);
  const registeredMarkets = useEventStore((s) => s.markets);
  const handleCrank = async (definedAccount: AccountInfo) =>
    // Use fire and water if on the local network, otherwise get the actual melee data.
    fetchAllCurrentMeleeData()
      .then(({ market1, market2 }) => [market1.symbolEmojis, market2.symbolEmojis])
      .then(([symbol1, symbol2]) => {
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

  const initializeArena = async (definedAccount: AccountInfo) => {
    if (APTOS_NETWORK !== Network.LOCAL) {
      console.warn("Can't set next melee duration unless in a local development environment.");
      return;
    }
    await EmojicoinArena.SetNextMeleeDuration.submit({
      aptosConfig: aptos.config,
      emojicoinArena: getLocalPublisher(),
      duration: 60 * 1_000_000,
    }).then((res) => {
      if (res.success) {
        successfulTransactionToast(res, { name: Network.LOCAL });
      } else {
        toast.error("Fail.");
      }
    });
    const iterEmojis: SymbolEmoji[] = ["⚽", "🎐", "🍧", "🏔️", "🌨️", "❄️"];
    for (const emojis of iterEmojis.map((v) => [v])) {
      try {
        // This is not robust. Just for testing.
        const exists = await MarketMetadataByMarketAddress.view({
          aptos: getAptosClient().config,
          marketAddress: getMarketAddress(emojis),
        }).then((res) => !!res.vec.pop());

        if (exists) {
          continue;
        }
        await RegisterMarket.builder({
          aptosConfig: getAptosClient().config,
          registrant: definedAccount.address,
          emojis: [encodeEmojis(emojis)],
          integrator: INTEGRATOR_ADDRESS,
        })
          .then((builder) => builder.payloadBuilder.toInputPayload())
          .then(submit)
          .then((res) => res!.response)
          .then(getEvents)
          .then((models) =>
            Swap.builder({
              aptosConfig: getAptosClient().config,
              swapper: definedAccount.address,
              marketAddress: models.marketRegistrationEvents[0].marketMetadata.marketAddress,
              inputAmount: 1n,
              isSell: false,
              integrator: INTEGRATOR_ADDRESS,
              integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS,
              minOutputAmount: 0n,
              typeTags: toCoinTypesForEntry(
                models.marketRegistrationEvents[0].marketMetadata.marketAddress
              ),
            })
          );
      } catch {
        // Do nothing.
      }
    }
    await handleCrank(definedAccount);
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
              disabled={!FEATURE_FLAGS.Arena}
              onClick={forceConnectOrRunFunction(handleCrank)}
              className={debugButtonClassName}
            >
              {"Crank melee"}
            </button>
            <button
              disabled={!FEATURE_FLAGS.Arena}
              onClick={forceConnectOrRunFunction(initializeArena)}
              className={debugButtonClassName}
              title="Initialize arena stuff for test"
            >
              {"init arena"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default InnerDisplayDebugData;
