import Big from "big.js";
import { FormattedNumber } from "components/FormattedNumber";
import { useMemo, useState } from "react";

import { useMatchBreakpoints } from "@/hooks/index";
import type {
  ArenaInfoModel,
  ArenaLeaderboardHistoryWithArenaInfoModel,
  ArenaPositionModel,
  MarketStateModel,
} from "@/sdk/indexer-v2/types";
import { q64ToBig } from "@/sdk/utils";

import { MeleeBreakdown } from "./melee-breakdown/MeleeBreakdown";
import { MeleeHistory } from "./melee-history/MeleeHistory";

export type ProfileTabProps = {
  position?: ArenaPositionModel | null;
  market0: MarketStateModel;
  market1: MarketStateModel;
  history: ArenaLeaderboardHistoryWithArenaInfoModel[];
  setHistory: (history: ArenaLeaderboardHistoryWithArenaInfoModel[]) => void;
  arenaInfo: ArenaInfoModel;
};

const headerFlexColClass = "flex flex-col justify-evenly";
const headerTitleClass = "text-light-gray text-xl uppercase text-nowrap";
const headerValueClass = "text-white text-4xl font-forma uppercase";

const CurrentMeleeStats = ({
  netDeposits,
  currentLockedValue,
  pnl,
  pnlOctas,
}: {
  netDeposits?: bigint;
  currentLockedValue?: bigint;
  pnl?: number;
  pnlOctas?: bigint;
}) => {
  const { isMobile } = useMatchBreakpoints();
  return (
    <div
      className={`border-b border-solid border-dark-gray text-ec-blue flex ${isMobile ? "flex-wrap" : ""} p-[2em] gap-[2em]`}
      style={
        isMobile
          ? {}
          : {
              gridRow: "1",
              gridColumn: "1 / 3",
            }
      }
    >
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>Net deposits</div>
        {netDeposits !== undefined ? (
          <FormattedNumber
            className={headerValueClass}
            value={netDeposits}
            decimals={2}
            nominalize
            suffix=" APT"
          />
        ) : (
          <div className={headerValueClass}>--</div>
        )}
      </div>
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>Current locked value</div>
        {currentLockedValue !== undefined ? (
          <FormattedNumber
            className={headerValueClass}
            value={currentLockedValue}
            decimals={2}
            nominalize
            suffix=" APT"
          />
        ) : (
          <div className={headerValueClass}>--</div>
        )}
      </div>
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>Pnl</div>
        {pnl !== undefined && pnlOctas !== undefined ? (
          <span>
            <FormattedNumber
              className={headerValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")}
              value={pnl!}
              suffix="%"
            />
            <span className={headerValueClass}> </span>
            <FormattedNumber
              className={headerValueClass + " !text-2xl text-nowrap"}
              value={pnlOctas}
              decimals={2}
              nominalize
              prefix="("
              suffix=" APT)"
            />
          </span>
        ) : (
          <div className={headerValueClass}>--</div>
        )}
      </div>
    </div>
  );
};

const Inner: React.FC<
  ProfileTabProps & {
    historyHidden: boolean;
    setHistoryHidden: (historyHidden: boolean) => void;
    goToEnter: () => void;
    setHistory: (history: ArenaLeaderboardHistoryWithArenaInfoModel[]) => void;
  }
> = ({
  history,
  setHistory,
  position,
  historyHidden,
  setHistoryHidden,
  arenaInfo,
  market0,
  market1,
  goToEnter,
}) => {
  const { isMobile } = useMatchBreakpoints();

  const [selectedRow, setSelectedRow] = useState<number>();
  const meleeBreakdown = useMemo(
    () => (
      <MeleeBreakdown
        {...{
          position,
          market0,
          market1,
          history,
          selectedRow,
          historyHidden,
          goToEnter,
          close: () => setSelectedRow(undefined),
        }}
      />
    ),
    [position, market0, market1, history, selectedRow, setSelectedRow, historyHidden, goToEnter]
  );

  if (isMobile) {
    return (
      <MeleeHistory
        {...{
          history,
          position,
          market0,
          market1,
          selectedRow,
          setSelectedRow,
          setHistoryHidden,
          arenaInfo,
          setHistory,
        }}
      />
    );
  }

  if (history.length === 0 && !position) {
    return (
      <div
        className="border-solid border-dark-gray border-[1px] border-t-[0px] text-ec-blue"
        style={{
          gridRow: "2",
          gridColumn: "1 / 3",
        }}
      >
        {meleeBreakdown}
      </div>
    );
  }

  return (
    <>
      <div
        className="text-ec-blue overflow-hidden"
        style={{
          gridRow: "2",
          gridColumn: "1",
        }}
      >
        {historyHidden ? (
          <div
            className="text-light-gray cursor-pointer h-[100%] bg-dark-gray/25 grid place-items-center"
            style={{
              gridRow: "2",
              gridColumn: "1",
            }}
            onClick={() => setHistoryHidden(false)}
          >
            <div>&gt;&gt;</div>
          </div>
        ) : (
          <MeleeHistory
            {...{
              history,
              position,
              market0,
              market1,
              selectedRow,
              setSelectedRow,
              setHistoryHidden,
              arenaInfo,
              setHistory,
            }}
          />
        )}
      </div>
      <div
        className="border-solid border-dark-gray border-[0] border-l-[1px] text-ec-blue"
        style={{
          gridRow: "2",
          gridColumn: "2",
        }}
      >
        {meleeBreakdown}
      </div>
    </>
  );
};

export const ProfileTab = ({
  position,
  market0,
  market1,
  history,
  setHistory,
  goToEnter,
  arenaInfo,
}: ProfileTabProps & { goToEnter: () => void }) => {
  const [historyHidden, setHistoryHidden] = useState<boolean>(false);

  const locked =
    position && position.meleeID === arenaInfo.meleeID
      ? BigInt(
          q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
            .mul(position.emojicoin0Balance.toString())
            .add(
              q64ToBig(market1.lastSwap.avgExecutionPriceQ64).mul(
                position.emojicoin1Balance.toString()
              )
            )
            .round()
            .toString()
        )
      : undefined;
  const profits =
    position && position.meleeID === arenaInfo.meleeID ? locked! + position.withdrawals : undefined;
  const pnl =
    position && position.meleeID === arenaInfo.meleeID
      ? Big(profits!.toString()).div(position.deposits.toString()).sub(1).mul(100).toNumber()
      : undefined;
  const pnlOctas =
    position && position.meleeID === arenaInfo.meleeID
      ? BigInt(
          Big(position.deposits.toString())
            .mul(pnl! / 100)
            .round()
            .toString()
        )
      : undefined;

  const { isMobile } = useMatchBreakpoints();

  return (
    <div
      className={isMobile ? "flex flex-col w-[100%]" : "grid h-[100%] w-[100%]"}
      style={{
        gridTemplateRows: "1fr 2fr",
        gridTemplateColumns:
          (history.length > 0 || position) && historyHidden ? "3em 1fr" : "1fr 1fr",
      }}
    >
      <CurrentMeleeStats
        netDeposits={
          position && position.meleeID === arenaInfo.meleeID ? position.deposits : undefined
        }
        currentLockedValue={locked}
        pnl={pnl}
        pnlOctas={pnlOctas}
      />
      <Inner
        {...{
          history,
          setHistory,
          historyHidden,
          setHistoryHidden,
          position,
          locked,
          pnl,
          pnlOctas,
          arenaInfo,
          goToEnter,
          market0,
          market1,
        }}
      />
    </div>
  );
};
