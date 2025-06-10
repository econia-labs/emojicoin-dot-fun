import { toBlob, toJpeg, toPng } from "html-to-image";
import { cn } from "lib/utils/class-name";
import { useMemo, useRef } from "react";
import { useWindowSize } from "react-use";
import { GlowingEmoji } from "utils/emoji";

import usePnlModalStore from "@/store/pnl-modal/store";

import Button from "../button";
import { FormattedNumber } from "../FormattedNumber";
import { BaseModal } from "../modal/BaseModal";
import { AptDisplay } from "../pages/arena/tabs/enter-tab/summary/utils";
import { FormattedNominalNumber } from "../pages/arena/tabs/utils";
import LogoIcon from "../svg/icons/LogoIcon";
import pnlBackground from "../../../public/images/pnl.jpeg";
import NextImage from "next/image";
import { sleep } from "@/sdk/index";

interface Props {
  market: string;
  pnl: number;
  deposits: bigint;
  endHolding?: bigint;
  lockedValue?: bigint;
}

const WIDTH = 600;
const ASPECT_RATIO = 16 / 9;
const HEIGHT = 337.5;
const IMAGE_SIZE_ON_DISK = 440000; // 44 KB.
const IMAGE_STYLES = {
  transform: "",
  backgroundImage: `url(${pnlBackground.src})`,
};
const HTML_TO_IMAGE_PROPS = {
  cacheBust: true,
  style: IMAGE_STYLES,
};

const ensureImageLoaded = async (element: HTMLDivElement) => {
  await new Promise((res) => {
    const img = new Image();
    img.src = pnlBackground.src;
    if (img.complete) res(undefined);
    else img.onload = () => res(undefined);
  });

  const tryBlob = () => toBlob(element, HTML_TO_IMAGE_PROPS).catch(() => null);

  let blob = await tryBlob();

  // Retry up to 3 times if blob is too small due to the image not properly loading.
  // `ensureImageLoaded` should work, theoretically, but it doesn't always do the trick.
  // Sometimes it does though, so that in combination with 3 attempts and sleeping in between
  // make things much more reliable.
  let i = 0;
  while (!blob || (blob.size < IMAGE_SIZE_ON_DISK && i < 3)) {
    if (i > 0) await sleep(25);
    blob = await tryBlob();
    i++;
  }
  return blob;
};

export const PnlModal = ({ market, pnl, deposits, endHolding, lockedValue }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const setIsPnlModalOpen = usePnlModalStore((s) => s.setOpen);
  const finalProfit = (endHolding || lockedValue || 0n) - (deposits || 0n);

  const { width } = useWindowSize();
  const { lesserWidth, scale, top } = useMemo(() => {
    if (!width) return { scale: 1, top: 0 };
    const lesserWidth = Math.min(width, WIDTH);
    // To ensure there's no gap between the image and the download/share
    // buttons on thinner screen sizes, calculate excess vertical margins
    // by finding the difference between the real image height and the
    // scaled image height, then use that as the margin on the bottom.
    const scale = lesserWidth / WIDTH;
    const scaledHeight = Math.floor(HEIGHT * scale);
    // The excess vertical margin we must account for due to the transform/scale.
    const excessVerticalMargin = -(HEIGHT - scaledHeight) / 2;
    // The intended space between the image and the buttons.
    const intendedVerticalMargin = 20 * scale;
    return {
      lesserWidth,
      scale,
      top: excessVerticalMargin + intendedVerticalMargin,
    };
  }, [width]);

  const handleExport = async () => {
    if (!ref.current) return;
    try {
      await ensureImageLoaded(ref.current);
      const dataUrl = await toJpeg(ref.current, HTML_TO_IMAGE_PROPS);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "pnl.jpeg";
      link.click();
    } catch (error) {
      console.error("Error exporting PNL image:", error);
      alert("Failed to export image. Please try again.");
    }
  };

  return (
    <BaseModal isOpen={true} onClose={() => setIsPnlModalOpen(false)}>
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col justify-between items-start",
          "border-solid border-2 border-darker-gray p-8"
        )}
        style={{
          width: WIDTH,
          height: WIDTH / ASPECT_RATIO,
          transform: `scale(${scale})`,
        }}
      >
        <NextImage
          src={pnlBackground.src}
          alt="pnl-background-ape"
          layout="fill"
          objectFit="cover"
          quality={100}
          loading="eager"
          priority={true}
          className="absolute inset-0 -z-10"
        />
        <LogoIcon className="mt-4 mb-8" width="250px" color="econiaBlue" />
        <div className="flex flex-col gap-1 items-start">
          <div className="flex gap-4 items-center">
            <GlowingEmoji emojis={market} className="text-[3rem]" />
            {pnl && (
              <FormattedNumber
                className={cn(
                  pnl >= 0 ? "!text-green" : "!text-pink",
                  "text-[2.5rem] md:text-[3rem] font-forma font-extrabold tracking-wide"
                )}
                value={pnl}
                prefix={pnl >= 0 ? "+" : ""}
                suffix="%"
              />
            )}
          </div>
          <div className="text-3xl font-forma text-light-gray">
            ({finalProfit >= 0 ? "+" : ""}
            <FormattedNominalNumber value={finalProfit} suffix=" APT" />)
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
      <div
        className="relative inline-flex flex-row justify-center gap-3"
        style={{ width: lesserWidth }}
      >
        <Button className="absolute !p-0" onClick={handleExport} style={{ top }}>
          Download
        </Button>
        {navigator.canShare && navigator.share && (
          <Button
            className="absolute !p-0"
            style={{ top }}
            onClick={async () => {
              if (!ref.current) return;
              try {
                const blob = await ensureImageLoaded(ref.current);
                if (!blob) throw new Error("Couldn't create blob.");
                const files = [new File([blob], "pnl.jpeg", { type: "image/jpeg" })];

                if (navigator.canShare && navigator.canShare({ files })) {
                  await navigator.share({ files, text: "Check out my PnL!" });
                } else {
                  alert("Sharing this file type is not supported.");
                }
              } catch (error) {
                if (error && (error as DOMException).name !== "AbortError") {
                  alert("Failed to share image. Please try again.");
                }
              }
            }}
          >
            Share
          </Button>
        )}
      </div>
    </BaseModal>
  );
};
