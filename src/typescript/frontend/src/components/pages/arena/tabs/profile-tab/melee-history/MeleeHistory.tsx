import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { Emoji } from "utils/emoji";

import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";
import type { ArenaLeaderboardHistoryWithArenaInfoModel } from "@/sdk/indexer-v2/types";

import { CurrentMeleeBreakdown, HistoricMeleeBreakdown } from "../melee-breakdown/MeleeBreakdown";
import type { ProfileTabProps } from "../ProfileTab";
import styles from "./History.module.css";

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

export const MeleeHistory = ({
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
