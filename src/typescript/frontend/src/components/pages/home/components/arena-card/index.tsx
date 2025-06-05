"use client";

import "./module.css";

import type { HomePageProps } from "app/home/HomePage";
import Button from "components/button";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "router/routes";
import { GlowingEmoji } from "utils/emoji";

import ArenaMarketsPriceDeltaPopover from "@/components/pages/arena/ArenaMarketsPriceDeltaPopover";
import { FlexGap } from "@/containers";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { getEmojisInString } from "@/sdk/emoji_data";
import { toTotalAptLocked } from "@/sdk/indexer-v2/types";

import GetMatchedEarlyMessage from "../GetMatchedEarlyMessage";

type ArenaCardProps = {
  meleeData: NonNullable<HomePageProps["meleeData"]>;
};

const meleeDataToArenaCardProps = ({
  arenaInfo,
  market0,
  market1,
  market0Delta,
  market1Delta,
}: ArenaCardProps["meleeData"]) => ({
  market0Symbol: market0.market.symbolEmojis.join(""),
  market1Symbol: market1.market.symbolEmojis.join(""),
  rewardsRemaining: arenaInfo.rewardsRemaining,
  meleeVolume: arenaInfo.volume,
  aptLocked: toTotalAptLocked({
    market0: {
      state: market0.state,
      locked: arenaInfo.emojicoin0Locked,
    },
    market1: {
      state: market1.state,
      locked: arenaInfo.emojicoin1Locked,
    },
  }),
  startTime: arenaInfo.startTime,
  duration: arenaInfo.duration / 1000n / 1000n,
  market0Delta,
  market1Delta,
});

export const ArenaCard = ({ meleeData }: ArenaCardProps) => {
  const currentMeleeInfo = useCurrentMeleeInfo();

  const {
    market0Symbol,
    market1Symbol,
    rewardsRemaining,
    meleeVolume,
    aptLocked,
    startTime,
    duration,
    market0Delta,
    market1Delta,
  } = useMemo(() => {
    const { meleeInfo: arenaInfo, market0, market1 } = currentMeleeInfo;
    const { market0Delta, market1Delta } = meleeData;
    return arenaInfo && market0 && market1
      ? meleeDataToArenaCardProps({ arenaInfo, market0, market1, market0Delta, market1Delta })
      : meleeDataToArenaCardProps(meleeData);
  }, [currentMeleeInfo, meleeData]);

  const arenaVs = (
    <div
      className="grid gap-[.3em]"
      style={{
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      <div
        className={`relative grid place-items-center items-center symbol-${getEmojisInString(market0Symbol).length}`}
      >
        <div className="m-auto">
          <GlowingEmoji className="flex flex-row text-nowrap" emojis={market0Symbol} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market0Delta} />
      </div>
      <span className="vs m-auto text-[.8em] uppercase text-light-gray">vs</span>
      <div
        className={`relative grid place-items-center items-center symbol-${getEmojisInString(market1Symbol).length}`}
      >
        <div className="m-auto">
          <GlowingEmoji className="flex flex-row text-nowrap" emojis={market1Symbol} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market1Delta} />
      </div>
    </div>
  );

  return (
    <div className="my-[20px] flex w-full max-w-full flex-col md:my-[70px]">
      <div className="grid w-full max-w-full grid-cols-[1fr] grid-rows-[1fr_1fr] gap-[2em] md:grid-cols-[1fr_1fr] md:grid-rows-[1fr]">
        <Link className="flex w-[100%] flex-col gap-[3em] place-self-center" href={ROUTES.arena}>
          <GetMatchedEarlyMessage className="inline text-center md:hidden" />
          {arenaVs}
          <div className="hidden items-center justify-center md:flex">
            <Button scale="xl" className="mx-auto">
              Enter now
            </Button>
          </div>
        </Link>
        <div className={`flex max-w-full flex-col items-center gap-[2em] md:items-stretch`}>
          <GetMatchedEarlyMessage className="hidden text-start md:inline" />
          <Countdown duration={duration} startTime={startTime} />

          <div className="arena-market-data-text flex flex-col gap-[.4em]">
            <FlexGap gap="8px">
              <div className="font-forma uppercase text-medium-gray">Rewards remaining:</div>
              <div className="font-forma uppercase text-white">
                <div className="flex flex-row items-center justify-center">
                  <FormattedNumber value={rewardsRemaining} suffix=" APT" nominalize scramble />
                </div>
              </div>
            </FlexGap>

            <FlexGap gap="8px">
              <div className="uppercase">
                <div className="font-forma uppercase text-medium-gray">Melee volume:</div>
              </div>
              <div className="font-forma uppercase text-white">
                <div className="flex flex-row items-center justify-center">
                  <FormattedNumber value={meleeVolume} suffix=" APT" scramble nominalize />
                </div>
              </div>
            </FlexGap>

            <FlexGap gap="8px">
              <div className="font-forma uppercase text-medium-gray">APT locked:</div>
              <div className="font-forma uppercase text-white">
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
