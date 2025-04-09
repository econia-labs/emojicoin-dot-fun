import Big from "big.js";
import Button from "components/button";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useHistoricalPositions } from "lib/hooks/positions/use-historical-positions";
import { cn } from "lib/utils/class-name";
import { useMemo } from "react";
import { Emoji } from "utils/emoji";

import { ExplorerLink } from "@/components/explorer-link/ExplorerLink";
import { FormattedNumber } from "@/components/FormattedNumber";
import Info from "@/components/info";
import { Loading } from "@/components/loading";
import { useMatchBreakpoints } from "@/hooks/index";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { ArenaLeaderboardHistoryWithArenaInfoModel } from "@/sdk/index";

import { useTradingStats } from "../../../../../../hooks/use-trading-stats";
import { FormattedNominalNumber } from "../../utils";
import type { ProfileTabProps } from "../ProfileTab";

export const MeleeBreakdownInner = ({
  meleeID,
  lastVersion,
  deposit,
  endHolding,
  withdrawn,
  pnl,
  lastHeld,
  historyHidden,
  close,
}: {
  meleeID: bigint;
  lastVersion: bigint;
  deposit: bigint;
  endHolding: bigint | undefined;
  withdrawn: bigint;
  pnl: number;
  lastHeld: string;
  historyHidden: boolean;
  close: () => void;
}) => {
  const { isMobile } = useMatchBreakpoints();
  const smallCellClass = "flex flex-col gap-[.2em]";
  const smallCellTextClass = "uppercase text-light-gray text-1xl";
  const smallCellValueClass = "text-white font-forma text-2xl";

  return (
    <div
      className="h-[100%] w-[100%] grid gap-[1em] relative"
      style={{
        gridTemplateRows: historyHidden ? "1fr 1fr" : "1fr 0.6fr 0.6fr",
        gridTemplateColumns: historyHidden ? "repeat(4, 1fr)" : "1fr 1fr",
        placeItems: "center",
        padding: historyHidden ? "2em 2em" : "0 2em",
      }}
    >
      <div
        className={`col-start-1 col-end-3 ${historyHidden ? "row-start-1" : ""} ${historyHidden ? "row-end-3" : ""} h-[100%] w-[100%] grid place-items-center`}
      >
        <div className="flex flex-col gap-[1em]">
          <div className="uppercase text-light-gray text-3xl text-center">{"Summary"}</div>
          <div className="text-5xl text-center">
            <Emoji emojis={lastHeld} />
          </div>
          <ExplorerLink value={lastVersion} type={"version"} className="hover:underline">
            <div className="text-[1em] text-center uppercase text-ec-blue">{`Melee #${meleeID}`}</div>
          </ExplorerLink>
        </div>
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>{"Deposit"}</div>
        <FormattedNominalNumber className={smallCellValueClass} value={deposit} suffix=" APT" />
      </div>
      <div className={smallCellClass}>
        <div className={cn(smallCellTextClass, "flex flex-row gap-2")}>
          <span>{"Withdrawn"}</span>
          <Info>{"The APT value of holdings withdrawn early"}</Info>
        </div>
        <FormattedNominalNumber className={smallCellValueClass} value={withdrawn} suffix=" APT" />
      </div>
      <div className={smallCellClass}>
        <div className={cn(smallCellTextClass, "flex flex-row gap-2")}>
          <span>{"End holdings"}</span>
          <Info>{"The APT value of holdings exactly when the melee ended"}</Info>
        </div>
        {endHolding !== undefined ? (
          <FormattedNominalNumber
            className={smallCellValueClass}
            value={endHolding}
            suffix=" APT"
          />
        ) : (
          <div className={smallCellValueClass}>{"--"}</div>
        )}
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>{"Pnl"}</div>
        <FormattedNumber
          className={smallCellValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")}
          value={pnl}
          suffix="%"
        />
      </div>
      {isMobile && (
        <div
          className="absolute right-0 top-0 uppercase text-xl text-light-gray cursor-pointer"
          onClick={close}
        >
          {"<< Hide"}
        </div>
      )}
    </div>
  );
};

export function CurrentMeleeBreakdown({
  historyHidden,
  close,
}: {
  historyHidden: boolean;
  close: () => void;
}) {
  const { position } = useCurrentPosition();
  const { pnl } = useTradingStats();
  const { market0, market1 } = useCurrentMeleeInfo();
  const marketLastHeld = useMemo(() => {
    if (!position || !market0 || !market1) return undefined;
    const { market } = position.lastExit0 || position.emojicoin0Balance > 0n ? market0 : market1;
    return market.symbolData.symbol;
  }, [position, market0, market1]);

  return (
    position &&
    pnl &&
    marketLastHeld && (
      <MeleeBreakdownInner
        meleeID={position.meleeID}
        lastVersion={position.version}
        deposit={position.deposits}
        withdrawn={position.withdrawals}
        endHolding={undefined}
        historyHidden={historyHidden}
        pnl={pnl}
        lastHeld={marketLastHeld}
        close={close}
      />
    )
  );
}

export function HistoricMeleeBreakdown({
  melee,
  historyHidden,
  close,
}: {
  melee: ArenaLeaderboardHistoryWithArenaInfoModel | undefined;
  historyHidden: boolean;
  close: () => void;
}) {
  // Got a weird bug where this crashed on me once. Not sure what it was so I'm safeguarding it.
  if (!melee || !("lastExit0" in melee)) return <Loading />;

  const lastHeld =
    melee.lastExit0 || melee.emojicoin0Balance > 0
      ? melee.emojicoin0Symbols.join("")
      : melee.emojicoin1Symbols.join("");
  const pnl = Big(melee.profits.toString())
    .mul(100)
    .div(melee.losses.toString())
    .sub(100)
    .toNumber();
  return (
    <MeleeBreakdownInner
      meleeID={melee.meleeID}
      lastVersion={melee.arenaInfoLastTransactionVersion}
      deposit={melee.losses}
      withdrawn={melee.withdrawals}
      endHolding={melee.profits - melee.withdrawals}
      historyHidden={historyHidden}
      pnl={pnl}
      lastHeld={lastHeld}
      close={close}
    />
  );
}

export const MeleeBreakdown = ({
  selectedRow,
  historyHidden,
  goToEnter,
  close,
}: Omit<ProfileTabProps, "setHistory" | "arenaInfo"> & {
  selectedRow: number | undefined;
  historyHidden: boolean;
  goToEnter?: () => void;
  close: () => void;
}) => {
  const { position, isLoading } = useCurrentPosition();
  const { history } = useHistoricalPositions();

  if (!position && selectedRow === undefined) {
    return isLoading ? (
      <Loading />
    ) : (
      <div className="grid place-items-center h-[100%] w-[100%]">
        <Button scale="lg" onClick={goToEnter}>
          {"Enter now"}
        </Button>
      </div>
    );
  }

  if (selectedRow === undefined) return <></>;

  if (selectedRow === -1)
    return <CurrentMeleeBreakdown historyHidden={historyHidden} close={close} />;

  return (
    <HistoricMeleeBreakdown
      melee={history[selectedRow]}
      historyHidden={historyHidden}
      close={close}
    />
  );
};
