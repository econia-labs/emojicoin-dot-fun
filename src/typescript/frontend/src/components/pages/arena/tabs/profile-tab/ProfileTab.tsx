import { FormattedNumber } from "components/FormattedNumber";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useHistoricalPositionsQuery } from "lib/hooks/queries/arena/use-historical-positions";
import { useMemo, useState } from "react";

import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import { useMatchBreakpoints } from "@/hooks/index";
import type { ArenaInfoModel, MarketStateModel } from "@/sdk/indexer-v2/types";

import { useArenaProfileStats } from "../../../../../hooks/use-arena-profile-stats";
import { FormattedAndNominalized } from "../utils";
import { MeleeBreakdown } from "./melee-breakdown/MeleeBreakdown";
import { MeleeHistory } from "./melee-history/MeleeHistory";

export type ProfileTabProps = {
  market0: MarketStateModel;
  market1: MarketStateModel;
  arenaInfo: ArenaInfoModel;
};

const headerFlexColClass = "flex flex-col justify-evenly";
const headerTitleClass = "text-light-gray text-xl uppercase text-nowrap";
const headerValueClass = "text-white text-3xl font-forma uppercase";
const MeleeStatsHyphens = () => <div className={headerValueClass}>{"--"}</div>;

const CurrentMeleeStats = () => {
  const { isMobile } = useMatchBreakpoints();
  const { isLoading, isFetching } = useCurrentPositionQuery();
  const { currentDeposited, locked, pnl, pnlOctas } = useArenaProfileStats();

  return (
    <div
      className={`border-b border-solid border-dark-gray text-ec-blue flex ${isMobile ? "flex-wrap" : ""} p-[2em] gap-[2em]`}
      style={isMobile ? {} : { gridRow: "1", gridColumn: "1 / 3" }}
    >
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>{"Current deposits"}</div>
        {isLoading || isFetching ? (
          <AnimatedLoadingBoxes numSquares={4} />
        ) : currentDeposited !== undefined ? (
          <FormattedAndNominalized
            className={headerValueClass}
            value={currentDeposited}
            suffix=" APT"
          />
        ) : (
          <MeleeStatsHyphens />
        )}
      </div>
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>{"Current locked value"}</div>
        {isLoading || isFetching ? (
          <AnimatedLoadingBoxes numSquares={4} />
        ) : locked !== undefined ? (
          <FormattedAndNominalized className={headerValueClass} value={locked} suffix=" APT" />
        ) : (
          <MeleeStatsHyphens />
        )}
      </div>
      <div className={headerFlexColClass + isMobile ? "" : " h-[100%]"}>
        <div className={headerTitleClass}>{"Pnl"}</div>
        {isLoading || isFetching ? (
          <AnimatedLoadingBoxes numSquares={4} />
        ) : pnl !== undefined && pnlOctas !== undefined ? (
          <span>
            <FormattedNumber
              className={headerValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")}
              value={pnl}
              suffix="%"
            />
            <span className={headerValueClass}> </span>
            <FormattedAndNominalized
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
  const { isMobile } = useMatchBreakpoints();
  const [selectedRow, setSelectedRow] = useState<number>();
  const { position } = useCurrentPositionQuery();
  const { history } = useHistoricalPositionsQuery();

  const meleeBreakdown = useMemo(
    () => <MeleeBreakdown {...{ ...props, selectedRow, close: () => setSelectedRow(undefined) }} />,
    [props, selectedRow]
  );

  if (isMobile) return <MeleeHistory {...{ ...props, selectedRow, setSelectedRow }} />;

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
      <div className="text-ec-blue overflow-hidden" style={{ gridRow: "2", gridColumn: "1" }}>
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
        className="border-solid border-dark-gray border-[0] border-l-[1px] text-ec-blue"
        style={{ gridRow: "2", gridColumn: "2" }}
      >
        {meleeBreakdown}
      </div>
    </>
  );
};

export default function ProfileTab(props: ProfileTabProps & { goToEnter: () => void }) {
  const [historyHidden, setHistoryHidden] = useState<boolean>(false);
  const { position } = useCurrentPositionQuery();
  const { history } = useHistoricalPositionsQuery();
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
      <CurrentMeleeStats />
      <Inner {...props} historyHidden={historyHidden} setHistoryHidden={setHistoryHidden} />
    </div>
  );
}
