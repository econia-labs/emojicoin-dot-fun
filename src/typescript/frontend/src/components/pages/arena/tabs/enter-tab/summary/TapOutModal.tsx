import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import type { UserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";

import BlurModal from "../BlurModal";

const formatter = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 2,
});

export default function TapOutModal({
  position,
  onTapOut,
  setIsTappingOut,
}: {
  position?: UserPositionWithInfo | null;
  onTapOut: () => void;
  setIsTappingOut: (value: boolean) => void;
}) {
  const matchNumberText = position
    ? formatter.format(Number(position.matchAmount) / 10 ** 8)
    : undefined;

  return (
    <BlurModal close={() => setIsTappingOut(false)}>
      <div className="flex flex-col gap-[1.5em] uppercase max-w-[58ch]">
        <div className="text-4xl text-white text-center">Are you sure you want to tap out?</div>
        <div className="flex flex-col gap-[2em]">
          <div className="font-forma text-light-gray leading-6">
            You have been matched a total of{" "}
            <span className="text-warning">{(matchNumberText ?? "?") + " APT"}</span> since your
            first deposit to an empty escrow.{" "}
            <span className="text-lighter-gray font-bold">
              To exit before the melee is over, you must return the matched amount.
            </span>
          </div>
          <div className="font-forma text-light-gray leading-6">
            If you don&apos;t want to pay the tap out penalty, wait to exit until the melee has
            ended and then you&apos;ll be able to keep all matched deposits.
          </div>
        </div>
      </div>
      <ButtonWithConnectWalletFallback>
        <Button scale="lg" onClick={onTapOut}>
          Yes, pay fee and tap out
        </Button>
      </ButtonWithConnectWalletFallback>
    </BlurModal>
  );
}
