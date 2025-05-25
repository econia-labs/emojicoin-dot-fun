import { FormattedNumber } from "components/FormattedNumber";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useHistoricalPositions } from "lib/hooks/positions/use-historical-positions";
import { useMemo, useState } from "react";

import type { ArenaInfoModel, MarketStateModel } from "@/sdk/indexer-v2/types";

import { useTradingStats } from "../../../../../hooks/use-trading-stats";
import { AnimatedLoadingBoxesWithFallback, FormattedNominalNumber } from "../utils";
import { MeleeBreakdown } from "./melee-breakdown/MeleeBreakdown";
import { MeleeHistory } from "./melee-history/MeleeHistory";

export type ProfileTabProps = {
  market0: MarketStateModel;
  market1: MarketStateModel;
  arenaInfo: ArenaInfoModel;
};

const headerFlexColClass = "md:h-full flex flex-col justify-start";
const headerTitleClass = "text-light-gray text-xl uppercase text-nowrap";
const headerValueClass = "text-white text-3xl font-forma uppercase";
const MeleeStatsHyphens = () => <div className={headerValueClass}>{"--"}</div>;

const CurrentMeleeStats = () => {
  const { isLoading } = useCurrentPosition();
  const { deposits, locked, pnl, pnlOctas } = useTradingStats();

  return (
    <div
      className={`border-b row-[1] col-[1/3] border-solid border-dark-gray text-ec-blue flex flex-wrap md:flex-nowrap p-[2em] gap-[2em]`}
    >
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>{"Current deposits"}</div>
        {isLoading ? (
          <AnimatedLoadingBoxesWithFallback numSquares={4} fallback={<MeleeStatsHyphens />} />
        ) : deposits !== undefined ? (
          <FormattedNominalNumber className={headerValueClass} value={deposits} suffix=" APT" />
        ) : (
          <MeleeStatsHyphens />
        )}
      </div>
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>{"Current locked value"}</div>
        {isLoading ? (
          <AnimatedLoadingBoxesWithFallback numSquares={4} fallback={<MeleeStatsHyphens />} />
        ) : locked !== undefined ? (
          <FormattedNominalNumber className={headerValueClass} value={locked} suffix=" APT" />
        ) : (
          <MeleeStatsHyphens />
        )}
      </div>
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>{"Pnl"}</div>
        {isLoading ? (
          <AnimatedLoadingBoxesWithFallback numSquares={4} fallback={<MeleeStatsHyphens />} />
        ) : pnl !== undefined && pnlOctas !== undefined ? (
          <span>
            <FormattedNumber
              className={headerValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")}
              value={pnl}
              suffix="%"
            />
            <span className={headerValueClass}> </span>
            <FormattedNominalNumber
              className={headerValueClass + " !text-2xl text-nowrap"}
              value={pnlOctas}
              prefix="("
              suffix=" APT)"
            />
          </span>
        ) : (
          <MeleeStatsHyphens />
        )}
      </div>
    </div>
  );
};

const Inner = (
  props: ProfileTabProps & {
    historyHidden: boolean;
    setHistoryHidden: (historyHidden: boolean) => void;
    goToEnter: () => void;
  }
) => {
  const [selectedRow, setSelectedRow] = useState<number>();
  const { position } = useCurrentPosition();
  const { history } = useHistoricalPositions();

  const meleeBreakdown = useMemo(
    () => <MeleeBreakdown {...{ ...props, selectedRow, close: () => setSelectedRow(undefined) }} />,
    [props, selectedRow]
  );

  if (history.length === 0 && !position)
    return (
      <div
        className="border-solid border-dark-gray border-[1px] border-t-[0px] text-ec-blue"
        style={{ gridRow: "2", gridColumn: "1 / 3" }}
      >
        {meleeBreakdown}
      </div>
    );

  return (
    <>
      <MeleeHistory className="md:hidden" {...{ ...props, selectedRow, setSelectedRow }} />
      <div
        className="hidden md:block text-ec-blue overflow-hidden"
        style={{ gridRow: "2", gridColumn: "1" }}
      >
        {props.historyHidden ? (
          <div
            className="text-light-gray cursor-pointer h-[100%] bg-dark-gray/25 grid place-items-center"
            style={{ gridRow: "2", gridColumn: "1" }}
            onClick={() => props.setHistoryHidden(false)}
          >
            <div>{">>"}</div>
          </div>
        ) : (
          <MeleeHistory {...{ ...props, selectedRow, setSelectedRow }} />
        )}
      </div>
      <div
        className="hidden md:block border-solid border-dark-gray border-[0] border-l-[1px] text-ec-blue"
        style={{ gridRow: "2", gridColumn: "2" }}
      >
        {meleeBreakdown}
      </div>
    </>
  );
};

export default function ProfileTab(props: ProfileTabProps & { goToEnter: () => void }) {
  const [historyHidden, setHistoryHidden] = useState<boolean>(false);
  const { position } = useCurrentPosition();
  const { history } = useHistoricalPositions();

  return (
    <div
      className={"flex flex-col md:grid md:h-full w-full"}
      style={{
        gridTemplateRows: "1fr 2fr",
        gridTemplateColumns:
          (history.length > 0 || position) && historyHidden ? "3em 1fr" : "1fr 1fr",
      }}
    >
      <CurrentMeleeStats />
      <Inner {...props} historyHidden={historyHidden} setHistoryHidden={setHistoryHidden} />
    </div>
  );
}
