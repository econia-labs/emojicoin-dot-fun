import Button from "components/button";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useHistoricalPositionsQuery } from "lib/hooks/queries/arena/use-historical-positions";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useMemo } from "react";
import { Emoji } from "utils/emoji";

import { ExplorerLink } from "@/components/explorer-link/ExplorerLink";
import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";
import type { SymbolEmoji } from "@/sdk/index";
import type { ArenaLeaderboardHistoryWithArenaInfoModel } from "@/sdk/indexer-v2/types";
import { useArenaEscrow } from "@/store/escrow/hooks";

import { CurrentMeleeBreakdown, HistoricMeleeBreakdown } from "../melee-breakdown/MeleeBreakdown";
import type { ProfileTabProps } from "../ProfileTab";
import styles from "./History.module.css";

const ScaledSymbolDisplay = ({ emojis }: { emojis: SymbolEmoji[] }) => {
  const { symbol, length } = useMemo(
    () => ({ symbol: emojis.join(""), length: emojis.length }),
    [emojis]
  );
  return (
    <td className={length >= 3 ? "text-xs" : length === 2 ? "text-sm" : "text-lg"}>
      {<Emoji emojis={symbol} />}
    </td>
  );
};

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
        <ScaledSymbolDisplay emojis={row.emojicoin0Symbols} />
        <td className={styles["text"]}>{"vs"}</td>
        <ScaledSymbolDisplay emojis={row.emojicoin1Symbols} />
        {/* If the position is open still, it means the arena is complete but the user hasn't exited yet. */}
        <td className={styles["text"]}>
          <ExplorerLink
            value={row.leaderboardHistoryLastTransactionVersion}
            type="version"
            className="hover:text-ec-blue hover:underline"
            title={escrow?.open ? "melee end txn— when your end holdings were calculated" : ""}
          >
            {escrow?.open ? "Complete" : "Exited"}
          </ExplorerLink>
        </td>
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

  // Don't display the position as a current position if it's in the fetched historical positions; display it as
  // a historical one, instead.
  const positionIsAlsoInHistory = useMemo(
    () => !!history.find((v) => v.meleeID === position?.meleeID),
    [position, history]
  );

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
          {position && position.meleeID === arenaInfo.meleeID && !positionIsAlsoInHistory && (
            <>
              <tr
                className={selectedRow === -1 ? styles["selected-row"] : ""}
                onClick={() => setSelectedRow(-1)}
              >
                <ScaledSymbolDisplay emojis={market0.market.symbolEmojis} />
                <td className={styles["text"]}>{"vs"}</td>
                <ScaledSymbolDisplay emojis={market1.market.symbolEmojis} />
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
