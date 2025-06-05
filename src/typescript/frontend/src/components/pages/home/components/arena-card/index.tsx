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
        className={`relative grid items-center place-items-center symbol-${getEmojisInString(market0Symbol).length}`}
      >
        <div className="m-auto">
          <GlowingEmoji className="flex flex-row text-nowrap" emojis={market0Symbol} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market0Delta} />
      </div>
      <span className="vs text-light-gray uppercase m-auto text-[.8em]">vs</span>
      <div
        className={`relative grid items-center place-items-center symbol-${getEmojisInString(market1Symbol).length}`}
      >
        <div className="m-auto">
          <GlowingEmoji className="flex flex-row text-nowrap" emojis={market1Symbol} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market1Delta} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full my-[20px] md:my-[70px] max-w-full">
      <div className="grid grid-rows-[1fr_1fr] md:grid-rows-[1fr] grid-cols-[1fr] md:grid-cols-[1fr_1fr] w-full max-w-full gap-[2em]">
        <Link className="place-self-center flex flex-col gap-[3em] w-[100%]" href={ROUTES.arena}>
          <GetMatchedEarlyMessage className="inline md:hidden text-center" />
          {arenaVs}
          <div className="hidden md:flex justify-center items-center">
            <Button scale="xl" className="mx-auto">
              Enter now
            </Button>
          </div>
        </Link>
        <div className={`flex flex-col gap-[2em] max-w-full items-center md:items-stretch`}>
          <GetMatchedEarlyMessage className="hidden md:inline text-start" />
          <Countdown duration={duration} startTime={startTime} />

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
