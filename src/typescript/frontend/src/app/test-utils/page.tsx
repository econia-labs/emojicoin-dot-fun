"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "@sdk/const";
import FEATURE_FLAGS from "lib/feature-flags";

import { MarketAddressConversionForm } from "@/components/pages/test-utils/market-address-conversion";
import { SetMeleeDurationForm } from "@/components/pages/test-utils/SetNewMeleeDuration";

export default function TestUtilsPage() {
  return (
    <>
      {APTOS_NETWORK !== Network.MAINNET && (
        <div className="w-full h-full flex flex-col">
          {APTOS_NETWORK === Network.LOCAL && FEATURE_FLAGS.Arena && (
            <SetMeleeDurationForm className="" />
          )}
          <MarketAddressConversionForm />
        </div>
      )}
    </>
  );
}
