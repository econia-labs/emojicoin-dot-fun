// cspell:Word vibing

import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { AptPriceContextProvider } from "context/AptPrice";
import { getAptPrice } from "lib/queries/get-apt-price";
import { type Metadata } from "next";
import { customTruncateAddress, resolveOwnerNameCached } from "../utils";

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
  const aptPrice = await getAptPrice();
  const { address, name } = await resolveOwnerNameCached(params.address);

  return (
    <div className="mx-auto">
      <AptPriceContextProvider aptPrice={aptPrice}>
        <WalletClientPage address={address ?? "invalid address"} name={name} />
      </AptPriceContextProvider>
    </div>
  );
}
