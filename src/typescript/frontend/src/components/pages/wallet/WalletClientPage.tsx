"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import AptosIconBlack from "@icons/AptosBlack";
import { formatDisplayName } from "@sdk/utils";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { FormattedNumber } from "components/FormattedNumber";
import { useUserEmojicoinBalances } from "lib/hooks/queries/use-fetch-owner-emojicoin-balances";
import { WalletTransactionTable } from "./WalletTransactionTable";
import { WalletPortfolioTable } from "./WalletPortfolioTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs/tabs";

export const WalletClientPage = ({ address }: { address: string }) => {
  const resolvedName = useNameResolver(address);
  const { ownedCoins, totalValue, isLoading } = useUserEmojicoinBalances(address);

  return (
    <div className="max-w-[100vw] px-2 sm:min-w-[80vw] md:min-w-[800px]">
      <span className="pixel-heading-2 mobile-sm:px-4 sm:px-0 flex flex-wrap gap-x-2 mb-4">
        Portfolio of{" "}
        <ExplorerLink className="text-ec-blue hover:underline" type="account" value={address}>
          {formatDisplayName(resolvedName, { noTruncateANSName: true })}
        </ExplorerLink>
      </span>
      <div className="flex justify-between w-full mb-4 flex-wrap gap-x-2 mobile-sm:px-4 sm:px-0">
        <span className="pixel-heading-3b">
          {"Total value: "}
          {isLoading ? (
            <>{"???"}</>
          ) : (
            <>
              <FormattedNumber scramble value={totalValue} style="sliding-precision" />
              <AptosIconBlack className="icon-inline ml-[2px]" />
            </>
          )}
        </span>
        <span className="pixel-heading-3b">
          Unique owned: {isLoading ? "?" : ownedCoins.length}
        </span>
      </div>
      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="trade-history">Trade History</TabsTrigger>
        </TabsList>
        <TabsContent value="portfolio">
          <WalletPortfolioTable address={address} />
        </TabsContent>
        <TabsContent value="trade-history">
          <WalletTransactionTable address={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
