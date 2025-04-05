import Big from "big.js";
import { Emoji } from "utils/emoji";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import { useMatchBreakpoints } from "@/hooks/index";
import type {
  ArenaLeaderboardHistoryWithArenaInfoModel,
  ArenaPositionModel,
  MarketStateModel,
} from "@/sdk/index";
import { q64ToBig } from "@/sdk/utils";

const MeleeBreakdownInner = ({
  deposit,
  endHolding,
  withdrawn,
  pnl,
  lastHeld,
  historyHidden,
  close,
}: {
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
          <div className="uppercase text-light-gray text-3xl text-center">Summary</div>
          <div className="text-5xl text-center">
            <Emoji emojis={lastHeld} />
          </div>
        </div>
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>Deposit</div>
        <FormattedNumber className={smallCellValueClass} value={deposit} suffix=" APT" nominalize />
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>Withdrawn</div>
        <FormattedNumber
          className={smallCellValueClass}
          value={withdrawn}
          suffix=" APT"
          nominalize
        />
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>End holdings</div>
        {endHolding !== undefined ? (
          <FormattedNumber
            className={smallCellValueClass}
            value={endHolding}
            suffix=" APT"
            nominalize
          />
        ) : (
          <div className={smallCellValueClass}>--</div>
        )}
      </div>
      <div className={smallCellClass}>
        <div className={smallCellTextClass}>Pnl</div>
        <FormattedNumber
          className={smallCellValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")}
          decimals={2}
          value={pnl}
          suffix="%"
        />
      </div>
      {isMobile && (
        <div
          className="absolute right-0 top-0 uppercase text-xl text-light-gray cursor-pointer"
          onClick={close}
        >
          &lt;&lt; Hide
        </div>
      )}
    </div>
  );
};

export function CurrentMeleeBreakdown({
  melee,
  market0,
  market1,
  historyHidden,
  close,
}: {
  melee: ArenaPositionModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
  historyHidden: boolean;
  close: () => void;
}) {
  const emojicoin0BalanceInApt = q64ToBig(market0.lastSwap.avgExecutionPriceQ64).mul(
    melee.emojicoin0Balance.toString()
  );
  const emojicoin1BalanceInApt = q64ToBig(market1.lastSwap.avgExecutionPriceQ64).mul(
    melee.emojicoin1Balance.toString()
  );
  const totalBalance = Big(melee.withdrawals.toString())
    .add(emojicoin0BalanceInApt)
    .add(emojicoin1BalanceInApt);
  const pnl = Big(totalBalance.toString())
    .mul(100)
    .div(melee.deposits.toString())
    .sub(100)
    .toNumber();
  const lastHeld =
    melee.lastExit0 || emojicoin0BalanceInApt.gt(0)
      ? market0.market.symbolEmojis.join("")
      : market1.market.symbolEmojis.join("");
  return (
    <MeleeBreakdownInner
      deposit={melee.deposits}
      withdrawn={melee.withdrawals}
      endHolding={undefined}
      {...{ historyHidden, pnl, lastHeld, close }}
    />
  );
}

export function HistoricMeleeBreakdown({
  melee,
  historyHidden,
  close,
}: {
  melee: ArenaLeaderboardHistoryWithArenaInfoModel;
  historyHidden: boolean;
  close: () => void;
}) {
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
      deposit={melee.losses}
      withdrawn={melee.profits}
      endHolding={melee.profits - melee.withdrawals}
      {...{ historyHidden, pnl, lastHeld, close }}
    />
  );
}

export const MeleeBreakdown = ({
  selectedRow,
  history,
  position,
  market0,
  market1,
  historyHidden,
  goToEnter,
  close,
}: {
  position?: ArenaPositionModel | null;
  market0: MarketStateModel;
  market1: MarketStateModel;
  history: ArenaLeaderboardHistoryWithArenaInfoModel[];
  selectedRow: number | undefined;
  historyHidden: boolean;
  goToEnter?: () => void;
  close: () => void;
}) => {
  if (!position && selectedRow === undefined) {
    return (
      <div className="grid place-items-center h-[100%] w-[100%]">
        <Button scale="lg" onClick={goToEnter}>
          Enter now
        </Button>
      </div>
    );
  }
  if (selectedRow === undefined) {
    return <></>;
  }
  if (selectedRow === -1) {
    return (
      <CurrentMeleeBreakdown melee={position!} {...{ market0, market1, historyHidden, close }} />
    );
  }
  return (
    <HistoricMeleeBreakdown
      melee={history[history.length - selectedRow - 1]}
      {...{ historyHidden, close }}
    />
  );
};
