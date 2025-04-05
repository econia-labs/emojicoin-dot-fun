import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useHistoricalPositionsQuery } from "lib/hooks/queries/arena/use-historical-positions";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { Emoji } from "utils/emoji";

import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";
import type { ArenaLeaderboardHistoryWithArenaInfoModel } from "@/sdk/indexer-v2/types";
import { useArenaEscrow } from "@/store/escrow/hooks";

import { CurrentMeleeBreakdown, HistoricMeleeBreakdown } from "../melee-breakdown/MeleeBreakdown";
import type { ProfileTabProps } from "../ProfileTab";
import styles from "./History.module.css";

const HistoricalRow = ({
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
  const escrow = useArenaEscrow(row.meleeID);

  return (
    <>
      <tr className={isSelected ? styles["selected-row"] : ""} onClick={select}>
        <td className={styles["emoji"]}>
          <Emoji emojis={row.emojicoin0Symbols.join("")} />
        </td>
        <td className={styles["text"]}>{"vs"}</td>
        <td className={styles["emoji"]}>
          <Emoji emojis={row.emojicoin1Symbols.join("")} />
        </td>
        {/* If the position is open still, it means the arena is complete but the user hasn't exited yet. */}
        <td className={styles["text"]}>{escrow?.open ? "Complete" : "Exited"}</td>
        <td>
          {escrow?.open ? (
            <ButtonWithConnectWalletFallback>
              <Button
                onClick={() => {
                  submit(exitTransactionBuilder);
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

/**
 * All melee history.
 */
export const MeleeHistory = ({
  market0,
  market1,
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
  const { position } = useCurrentPositionQuery();
  const { history } = useHistoricalPositionsQuery();

  return (
    <div className="h-[100%] overflow-auto">
      <div className="flex justify-between px-[1em] h-[3em] items-center border-dark-gray border-b-[1px] border-solid">
        <div className="uppercase text-md font-forma">{"History"}</div>
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
                <td className={styles["text"]}>{"vs"}</td>
                <td className={styles["emoji"]}>
                  <Emoji emojis={market1.market.symbolEmojis.join("")} />
                </td>
                <td className={styles["text"]}>{"Active"}</td>
                <td></td>
              </tr>
              {selectedRow === -1 && isMobile && (
                <tr>
                  <td colSpan={5}>
                    <CurrentMeleeBreakdown
                      historyHidden={false}
                      close={() => setSelectedRow(undefined)}
                    />
                  </td>
                </tr>
              )}
            </>
          )}
          {history.map((m, i) => (
            <HistoricalRow
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
