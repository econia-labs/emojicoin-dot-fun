"use client";

import { FlexGap } from "@containers";
import Button from "components/button";
import { FormattedNumber } from "components/FormattedNumber";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { Emoji } from "utils/emoji";
import "./module.css";
import { useInterval } from "react-use";
import { useMemo, useState } from "react";
import darkTheme from "theme/dark";
import { useMatchBreakpoints } from "@hooks/index";
import { getEmojisInString } from "@sdk/emoji_data";

type ArenaCardProps = {
  market0Symbol: string;
  market1Symbol: string;
  rewardsRemaining: bigint;
  meleeVolume: bigint;
  aptLocked: bigint;
  startTime: bigint;
  duration: bigint;
};

const TimerNumber = ({ n }: { n: string }) => (
  <div
    style={{
      border: `1px solid ${darkTheme.colors.darkGray}`,
      borderRadius: "5px",
      background: "black",
      width: "1.7ch",
      textAlign: "center",
      margin: ".1em",
      paddingLeft: ".05em",
      color: darkTheme.colors.econiaBlue,
    }}
  >
    {n}
  </div>
);

const Timer = ({ startTime, duration }: { startTime: bigint; duration: bigint }) => {
  const getRemaining = () => Number(duration) - (new Date().getTime() / 1000 - Number(startTime));
  const [remaining, setRemaining] = useState<number>(getRemaining());
  useInterval(() => {
    setRemaining(getRemaining());
  }, 1000);

  const seconds = useMemo(
    () =>
      Math.max(Math.round(remaining) % 60, 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );
  const minutes = useMemo(
    () =>
      Math.max(Math.round(remaining / 60) % 60, 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );
  const hours = useMemo(
    () =>
      Math.max(Math.round(remaining / 60 / 60), 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );

  return (
    <div className="text-light-gray flex flex-row pixel-clock w-min">
      <TimerNumber n={hours.split("")[0]} />
      <TimerNumber n={hours.split("")[1]} />
      <div className="my-auto w-[1ch] text-center">:</div>
      <TimerNumber n={minutes.split("")[0]} />
      <TimerNumber n={minutes.split("")[1]} />
      <div className="my-auto w-[1ch] text-center">:</div>
      <TimerNumber n={seconds.split("")[0]} />
      <TimerNumber n={seconds.split("")[1]} />
    </div>
  );
};

const GlowingEmoji = ({ emoji }: { emoji: string }) => (
  <div
    className={`relative grid items-center place-items-center symbol-${getEmojisInString(emoji).length}`}
  >
    <div className="absolute z-[-1]" style={{ filter: "blur(15px)" }}>
      <Emoji className="flex flex-nowrap text-nowrap" emojis={emoji} />
    </div>
    <Emoji className="flex flex-nowrap text-nowrap" emojis={emoji} />
  </div>
);

export const ArenaCard = ({
  market0Symbol,
  market1Symbol,
  rewardsRemaining,
  meleeVolume,
  aptLocked,
  startTime,
  duration,
}: ArenaCardProps) => {
  const { isMobile } = useMatchBreakpoints();

  const headerText = (
    <span
      className={`arena-pixel-heading-text text-white uppercase ${isMobile ? "text-center" : ""}`}
    >
      Lock in early to get the most rewards !
    </span>
  );

  const arenaVs = (
    <div
      className="grid gap-[.3em]"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      <GlowingEmoji emoji={market0Symbol} />
      <span className="vs text-light-gray uppercase m-auto text-[.8em]">vs</span>
      <GlowingEmoji emoji={market1Symbol} />
    </div>
  );

  return (
    <div className="flex flex-col w-full my-[20px] md:my-[70px] max-w-full">
      <div
        className="w-full max-w-full gap-[2em]"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gridTemplateRows: !isMobile ? "1fr" : "1fr 1fr",
        }}
      >
        <Link className="place-self-center flex flex-col gap-[3em] w-[100%]" href={ROUTES.arena}>
          {isMobile && headerText}
          {arenaVs}
          {!isMobile && (
            <Button scale="xl" className="mx-auto">
              Enter now
            </Button>
          )}
        </Link>
        <div className={`flex flex-col gap-[2em] max-w-full ${isMobile ? "items-center" : ""}`}>
          {!isMobile && headerText}
          <Timer duration={duration} startTime={startTime} />

          <div className="flex flex-col gap-[.4em] arena-market-data-text">
            <FlexGap gap="8px">
              <div className="font-forma text-medium-gray uppercase">Rewards remaining:</div>
              <div className="font-forma text-white uppercase">
                <div className="flex flex-row items-center justify-center">
                  <FormattedNumber value={rewardsRemaining} suffix=" APT" nominalize scramble />
                </div>
              </div>
            </FlexGap>

            <FlexGap gap="8px">
              <div className="uppercase">
                <div className="font-forma text-medium-gray uppercase">Melee volume:</div>
              </div>
              <div className="font-forma text-white uppercase">
                <div className="flex flex-row items-center justify-center">
                  <FormattedNumber value={meleeVolume} suffix=" APT" scramble nominalize />
                </div>
              </div>
            </FlexGap>

            <FlexGap gap="8px">
              <div className="font-forma text-medium-gray uppercase">APT locked:</div>
              <div className="font-forma text-white uppercase">
                <div className="flex flex-row items-center justify-center">
                  <FormattedNumber value={aptLocked} suffix=" APT" scramble nominalize />
                </div>
              </div>
            </FlexGap>
          </div>
        </div>
      </div>
    </div>
  );
};
