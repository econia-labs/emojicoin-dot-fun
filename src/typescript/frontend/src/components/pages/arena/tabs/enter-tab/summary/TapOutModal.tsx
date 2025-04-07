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
      <div className="flex flex-col gap-[3em] max-w-[58ch]">
        <div className="text-4xl uppercase text-white text-center">
          Are you sure you want to tap out?
        </div>
        <div className="font-forma text-light-gray leading-7 uppercase tracking-wide">
          You have been matched a total of{" "}
          <span className="text-warning">{matchNumberText ?? "?"}</span> APT since your first
          deposit to an empty escrow. To exit before the melee is over, you must pay back the{" "}
          <span className="text-warning">{matchNumberText ?? "?"}</span> APT in order to tap out.
        </div>
        <div className="font-forma text-light-gray leading-7 uppercase tracking-wide">
          If you don&apos;t want to pay the tap out penalty, wait to exit until the melee has ended
          and then you&apos;ll be able to keep all matched deposits.
        </div>
      </div>
      <ButtonWithConnectWalletFallback>
        <Button scale="lg" onClick={onTapOut}>
          {`Accept and exit, incurring a ${matchNumberText ?? "?"} APT tap out fee`}
        </Button>
      </ButtonWithConnectWalletFallback>
    </BlurModal>
  );
}
