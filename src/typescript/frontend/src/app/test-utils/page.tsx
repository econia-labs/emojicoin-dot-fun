"use client";

import { MarketAddressConversionForm } from "@/components/pages/test-utils/market-address-conversion";
import { SetMeleeDurationForm } from "@/components/pages/test-utils/SetNewMeleeDuration";
import { Network } from "@aptos-labs/ts-sdk";
import { APTOS_NETWORK } from "@sdk/const";

export default function TestUtilsPage() {
  return (
    <>
      {APTOS_NETWORK !== Network.MAINNET && (
        <div className="w-full h-full flex flex-col">
          {APTOS_NETWORK === Network.LOCAL && <SetMeleeDurationForm className="" />}
          <MarketAddressConversionForm />
        </div>
      )}
    </>
  );
}
