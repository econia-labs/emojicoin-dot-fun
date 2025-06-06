import { toPng } from "html-to-image";
import { cn } from "lib/utils/class-name";
import { useMemo, useRef } from "react";
import { useWindowSize } from "react-use";
import { GlowingEmoji } from "utils/emoji";

import Button from "../button";
import { FormattedNumber } from "../FormattedNumber";
import { BaseModal } from "../modal/BaseModal";
import { AptDisplay } from "../pages/arena/tabs/enter-tab/summary/utils";
import { FormattedNominalNumber } from "../pages/arena/tabs/utils";
import LogoIcon from "../svg/icons/LogoIcon";

interface Props {
  market: string;
  pnl: number;
  deposits: bigint;
  endHolding?: bigint;
  lockedValue?: bigint;
  onClose: () => void;
}

const WIDTH = 600;
const ASPECT_RATIO = 16 / 9;

// Helper function to generate a full-size image from an element
const generateFullSizeImage = async (element: HTMLDivElement): Promise<string> => {
  const clonedElement = element.cloneNode(true) as HTMLDivElement;

  // Reset transform and position for off-screen rendering at full size
  clonedElement.style.transform = ""; // Remove scaling

  document.body.appendChild(clonedElement);

  try {
    const dataUrl = await toPng(clonedElement);
    return dataUrl;
  } finally {
    document.body.removeChild(clonedElement);
  }
};

export const PnlModal = ({ market, pnl, deposits, endHolding, lockedValue, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const aptProfit = (endHolding || BigInt(0)) - (deposits || BigInt(0));

  const { width } = useWindowSize();
  const scale = useMemo(() => {
    if (!width) return 1;
    const scaledWidth = Math.min(width, WIDTH);
    return scaledWidth / WIDTH;
  }, [width]);

  const handleExport = async () => {
    if (!ref.current) return;

    try {
      const dataUrl = await generateFullSizeImage(ref.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "pnl.png";
      link.click();
    } catch (error) {
      console.error("Error exporting PNL image:", error);
      alert("Failed to export image. Please try again.");
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <div
        ref={ref}
        className="flex flex-col justify-between items-start border-solid border-2 border-dark-gray p-8 pb-8"
        style={{
          width: WIDTH,
          height: WIDTH / ASPECT_RATIO,
          transform: `scale(${scale})`,
          background: "url('/images/pnl.png')",
          backgroundSize: "cover",
        }}
      >
        <LogoIcon className="mt-4 mb-8" width="250px" color="econiaBlue" />
        <div className="flex flex-col gap-1 items-start">
          <div className="flex gap-4 items-center">
            <GlowingEmoji emojis={market} className="text-[3rem]" />
            {pnl && (
              <FormattedNumber
                className={cn(
                  pnl >= 0 ? "!text-green" : "!text-pink",
                  "text-[3.5rem] font-forma font-extrabold tracking-wide"
                )}
                value={pnl}
                prefix={pnl >= 0 ? "+" : ""}
                suffix="%"
              />
            )}
          </div>
          <div className="text-3xl font-forma text-light-gray">
            ({aptProfit >= 0 ? "+" : ""}
            <FormattedNominalNumber value={aptProfit} suffix=" APT" />)
          </div>
        </div>
        <div className="flex gap-6">
          {[
            {
              label: "Deposits",
              value: deposits,
            },
            {
              label: "End Holdings",
              value: endHolding,
            },
            {
              label: "Locked Value",
              value: lockedValue,
            },
          ].map(
            (item) =>
              item.value !== undefined && (
                <div key={item.label} className="flex items-start flex-col">
                  <span className="font-forma text-ec-blue text-lg uppercase">{item.label}</span>
                  <AptDisplay amount={item.value} className="font-forma text-lg" />
                </div>
              )
          )}
        </div>
      </div>
      <Button className="mt-2" onClick={handleExport}>
        Download
      </Button>
      {navigator.canShare && navigator.share && (
        <Button
          className="mt-2"
          onClick={async () => {
            if (!ref.current) return;
            try {
              const dataUrl = await generateFullSizeImage(ref.current);
              const blob = await fetch(dataUrl).then((r) => r.blob());
              const files = [new File([blob], "pnl.png", { type: "image/png" })];

              if (navigator.canShare && navigator.canShare({ files })) {
                await navigator.share({
                  files,
                  text: "Check out my PnL!",
                });
              } else {
                alert("Sharing this file type is not supported.");
              }
            } catch (error) {
              console.error("Error sharing PNL image:", error);
              alert("Failed to share image. Please try again.");
            }
          }}
        >
          Share
        </Button>
      )}
    </BaseModal>
  );
};
