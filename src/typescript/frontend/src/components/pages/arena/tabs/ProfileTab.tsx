import {
  type ArenaInfoModel,
  type ArenaLeaderboardHistoryWithArenaInfoModel,
  type ArenaPositionModel,
  type MarketStateModel,
} from "@sdk/indexer-v2/types";
import { q64ToBig } from "@sdk/utils";
import Big from "big.js";
import Button from "components/button";
import { FormattedNumber } from "components/FormattedNumber";
import styles from "./ProfileTab.module.css";
import { useMemo, useState } from "react";
import { Emoji } from "utils/emoji";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useMatchBreakpoints } from "@hooks/index";

export type ProfileTabProps = {
  position?: ArenaPositionModel | null;
  market0: MarketStateModel;
  market1: MarketStateModel;
  history: ArenaLeaderboardHistoryWithArenaInfoModel[];
  setHistory: (history: ArenaLeaderboardHistoryWithArenaInfoModel[]) => void;
  arenaInfo: ArenaInfoModel;
};

const HistoryRow = ({
  row,
  isSelected,
  select,
  close,
}: {
  row: ArenaLeaderboardHistoryWithArenaInfoModel;
  isSelected: boolean;
  select: () => void;
  close: () => void;
}) => {
  const { isMobile } = useMatchBreakpoints();
  const exitTransactionBuilder = useExitTransactionBuilder(
    row.emojicoin0MarketAddress as `0x${string}`,
    row.emojicoin1MarketAddress as `0x${string}`
  );
  const { submit } = useAptos();
  return (
    <>
      <tr className={isSelected ? styles["selected-row"] : ""} onClick={select}>
        <td className={styles["emoji"]}>
          <Emoji emojis={row.emojicoin0Symbols.join("")} />
        </td>
        <td className={styles["text"]}>vs</td>
        <td className={styles["emoji"]}>
          <Emoji emojis={row.emojicoin1Symbols.join("")} />
        </td>
        <td className={styles["text"]}>{row.exited ? "Exited" : "Complete"}</td>
        <td>
          {!row.exited ? (
            <ButtonWithConnectWalletFallback>
              <Button
                onClick={() => {
                  submit(exitTransactionBuilder).then((r) => {
                    if (r && !r.error) {
                      row.exited = true;
                    }
                  });
                }}
              >
                Exit
              </Button>
            </ButtonWithConnectWalletFallback>
          ) : (
            ""
          )}
        </td>
      </tr>
      {isSelected && isMobile && (
        <tr>
          <td colSpan={5}>
            <HistoricMeleeBreakdown melee={row} historyHidden={false} close={close} />
          </td>
        </tr>
      )}
    </>
  );
};

const History = ({
  position,
  market0,
  market1,
  history,
  selectedRow,
  setSelectedRow,
  setHistoryHidden,
  arenaInfo,
}: ProfileTabProps & {
  selectedRow: number | undefined;
  setSelectedRow: (selectedRow: number | undefined) => void;
  setHistoryHidden: (historyHidden: boolean) => void;
}) => {
  const { isMobile } = useMatchBreakpoints();
  return (
    <div className="h-[100%] overflow-auto">
      <div className="flex justify-between px-[1em] h-[3em] items-center border-dark-gray border-b-[1px] border-solid">
        <div className="uppercase text-md font-forma">History</div>
        {!isMobile && (
          <div
            className="uppercase text-xl text-light-gray cursor-pointer"
            onClick={() => setHistoryHidden(true)}
          >
            &lt;&lt; Hide
          </div>
        )}
      </div>
      <table className={styles["history-table"]}>
        <tbody>
          {position && position.meleeID === arenaInfo.meleeID && (
            <>
              <tr
                className={selectedRow === -1 ? styles["selected-row"] : ""}
                onClick={() => setSelectedRow(-1)}
              >
                <td className={styles["emoji"]}>
                  <Emoji emojis={market0.market.symbolEmojis.join("")} />
                </td>
                <td className={styles["text"]}>vs</td>
                <td className={styles["emoji"]}>
                  <Emoji emojis={market1.market.symbolEmojis.join("")} />
                </td>
                <td className={styles["text"]}>Active</td>
                <td></td>
              </tr>
              {selectedRow === -1 && isMobile && (
                <tr>
                  <td colSpan={5}>
                    <CurrentMeleeBreakdown
                      melee={position}
                      historyHidden={false}
                      close={() => setSelectedRow(undefined)}
                      {...{ market0, market1 }}
                    />
                  </td>
                </tr>
              )}
            </>
          )}
          {history.toReversed().map((m, i) => (
            <HistoryRow
              key={`history-table-row-${i}`}
              row={m}
              isSelected={selectedRow === i}
              select={() => setSelectedRow(i)}
              close={() => setSelectedRow(undefined)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

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

function CurrentMeleeBreakdown({
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

function HistoricMeleeBreakdown({
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

const MeleeBreakdown = ({
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

const headerFlexColClass = "flex flex-col justify-evenly";
const headerTitleClass = "text-light-gray text-xl uppercase text-nowrap";
const headerValueClass = "text-white text-4xl font-forma uppercase";

const Header = ({
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
      <History
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
          <History
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
      <Header
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
