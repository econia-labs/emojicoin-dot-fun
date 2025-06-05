import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import { CloseIcon } from "@/components/svg";
import type { UserPositionWithInfo } from "@/sdk/indexer-v2/queries/api/user-position/types";

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
    <div className="relative flex grow flex-col items-center gap-4 px-4">
      <CloseIcon
        onClick={() => setIsTappingOut(false)}
        className="absolute right-[.5em] top-[.5em] h-[2.5em] w-[2.5em] cursor-pointer p-[.5em]"
        color="econiaBlue"
      />
      <div className="flex max-w-[58ch] grow flex-col justify-center gap-[1.3em] uppercase">
        <div className="text-center text-4xl text-white">Are you sure you want to tap out?</div>
        <div className="flex flex-col gap-[1.5em]">
          <div className="font-forma leading-6 text-light-gray">
            You have been matched a total of{" "}
            <span className="text-warning">{(matchNumberText ?? "?") + " APT"}</span> since your
            first deposit to an empty escrow.{" "}
            <span className="font-bold text-lighter-gray">
              To exit before the melee is over, you must return the matched amount.
            </span>
          </div>
          <div className="font-forma leading-6 text-light-gray">
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
    </div>
  );
}
