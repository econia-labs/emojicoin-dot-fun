"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { type FullCoinData } from "app/wallet/[address]/page";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { Table, TableBody, TableHeader, TableRow } from "components/ui/table";
import _ from "lodash";
import { useCallback, useMemo, useState, type FC } from "react";
import { PortfolioHeader } from "./PortfolioHeader";
import { PortfolioRow } from "./PortfolioRow";

interface Props {
  address: string;
  ownedCoins: FullCoinData[];
  walletStats: {
    totalValue: number;
  };
}

const COLUMNS = [
  { key: "emoji", text: "Emoji", sortable: false, className: "w-[160px] text-start justify-start" },
  {
    key: "percentage",
    text: "Percentage",
    sortable: true,
    className: "w-[160px] text-center justify-center",
    sortCallback: (coin: FullCoinData) => coin.percentage,
  },
  {
    key: "amount",
    text: "Amount",
    sortable: true,
    className: "w-[100px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.amount,
  },
  {
    key: "marketCap",
    text: "Market cap",
    sortable: true,
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.marketCap,
  },
  {
    key: "usdValue",
    text: "USD Value",
    sortable: true,
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.ownedValue,
  },
  {
    key: "ownedValue",
    text: "Value",
    sortable: true,
    className: "w-[150px] text-right justify-end",
    sortCallback: (coin: FullCoinData) => coin.ownedValue,
  },
];

export const WalletClientPage: FC<Props> = ({ address, ownedCoins, walletStats }) => {
  const resolvedName = useNameResolver(address);

  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "ownedValue",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const sorted = useMemo(() => {
    const sortCallback = _.find(COLUMNS, { key: sort.column })?.sortCallback;
    return _.orderBy(ownedCoins, sortCallback, sort.direction);
  }, [sort.column, sort.direction, ownedCoins]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedCoins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [sorted, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <>
      <span className="pixel-heading-2">
        Portfolio of{" "}
        <ExplorerLink className="text-ec-blue hover:underline" type="account" value={address}>
          {formatDisplayName(resolvedName)}
        </ExplorerLink>
      </span>
      <div className="flex justify-between w-full mb-4">
        <span className="pixel-heading-3b">
          Total value: {walletStats.totalValue.toFixed(2)}{" "}
          <AptosIconBlack className="icon-inline" />
        </span>
        <span className="pixel-heading-3b">Unique owned: {ownedCoins.length}</span>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table className="border-solid border-[1px] border-dark-gray">
            <TableHeader>
              <TableRow isHeader>
                {COLUMNS.map((column) => (
                  <PortfolioHeader
                    key={column.key}
                    id={column.key}
                    sort={sort}
                    setSort={column.sortable ? setSort : undefined}
                    className={column.className}
                    text={column.text}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCoins.map((coin) => (
                <PortfolioRow key={coin.symbol} coinData={coin} walletStats={walletStats} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-dark-gray disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="pixel-text">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-dark-gray disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </>
  );
};
