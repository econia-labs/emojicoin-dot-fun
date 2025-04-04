// cspell:word mkts
"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { type AccountInfo, useWallet, type WalletName } from "@aptos-labs/wallet-adapter-react";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { APTOS_NETWORK } from "lib/env";
import FEATURE_FLAGS from "lib/feature-flags";
import { cn } from "lib/utils/class-name";
import { Minus, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { ROUTES } from "router/routes";
import { emoji } from "utils";

import { getLocalPublisher } from "@/components/pages/test-utils/local-publisher";
import { successfulTransactionToast } from "@/components/wallet/toasts";
import {
  EmojicoinArena,
  MarketMetadataByMarketAddress,
  RegisterMarket,
  Swap,
} from "@/move-modules";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS, ONE_APT } from "@/sdk/const";
import { encodeEmojis, type SymbolEmoji } from "@/sdk/emoji_data";
import { getEvents, getMarketAddress } from "@/sdk/emojicoin_dot_fun";
import { toEmojicoinTypesForEntry } from "@/sdk/markets";
import { fetchAllCurrentMeleeData, getAptosClient, toArenaCoinTypes } from "@/sdk/utils";

const iconClassName = "p-2 !text-white cursor-pointer !h-[40px] !w-[40px]";
const debugButtonClassName =
  "flex p-3 !text-white h-auto m-auto border border-sky-100 border-solid uppercase min-w-[18ch] hover:bg-dark-gray justify-center";

const InnerDisplayDebugData = () => {
  const { account, connect, connected, wallet } = useWallet();
  const { aptos, forceRefetch, submit } = useAptos();
  const [showDebugger, setShowDebugger] = useState(false);
  const registeredMarkets = useEventStore((s) => s.markets);
  const handleCrank = async (definedAccount: AccountInfo) =>
    // Use fire and water if on the local network, otherwise get the actual melee data.
    fetchAllCurrentMeleeData()
      .then(({ market0, market1 }) => [market0.symbolEmojis, market1.symbolEmojis])
      .then(([symbol0, symbol1]) => {
        const [c0, lp0, c1, lp1] = toArenaCoinTypes({ symbol0, symbol1 });
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
              typeTags: toEmojicoinTypesForEntry(
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
    (functionToCallIfConnected: (definedAccount: AccountInfo) => Promise<void>) => () =>
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
              onClick={forceConnectOrRunFunction((definedAccount) =>
                aptos
                  .fundAccount({
                    accountAddress: definedAccount.address,
                    amount: ONE_APT * 10000000,
                  })
                  .then(() => forceRefetch("apt"))
              )}
            >
              <span className="justify-start">
                {"Fund me"} {emoji("money bag")}
              </span>
            </button>
            <a className={cn(debugButtonClassName, "justify-center")} href={ROUTES["test-utils"]}>
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
            <a
              className={cn(debugButtonClassName, "justify-center")}
              href={ROUTES["dev"]["color-generator"]}
            >
              <span className="rotate-[-22.5deg]">{"/"}</span>
              <span className="lowercase">{"color-generator"}</span>
            </a>
          </>
        )}
      </div>
    </>
  );
};

export default InnerDisplayDebugData;
