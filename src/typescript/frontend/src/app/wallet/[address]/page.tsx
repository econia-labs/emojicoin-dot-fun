// cspell:Word vibing

import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { AptPriceContextProvider } from "context/AptPrice";
import { getAptPrice } from "lib/queries/get-apt-price";
import type { Metadata } from "next";

import { customTruncateAddress, resolveOwnerNameCached } from "../utils";
import UserNotFound from "./error";

type Props = {
  params: { address: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const input = params.address;

  const { name, address } = await resolveOwnerNameCached(input);
  const owner = name ?? (address ? customTruncateAddress(address) : input);

  return {
    title: `${owner}'s wallet`,
    description: `👀 Peep what's inside ${owner}'s wallet— are they stacking, trading, or just vibing?`,
  };
}
export default async function WalletPage({ params }: Props) {
  const { address, name } = await resolveOwnerNameCached(params.address);

  if (!(address || name)) {
    return <UserNotFound />;
  }

  const aptPrice = await getAptPrice();

  return (
    <div className="mx-auto">
      <AptPriceContextProvider aptPrice={aptPrice}>
        <WalletClientPage address={address} name={name} />
      </AptPriceContextProvider>
    </div>
  );
}
