import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { AptPriceContextProvider } from "context/AptPrice";
import { getAptPrice } from "lib/queries/get-apt-price";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export default async function WalletPage({ params }: { params: { address: string } }) {
  const aptPrice = await getAptPrice();

  return (
    <div className="mx-auto">
      <AptPriceContextProvider aptPrice={aptPrice}>
        <WalletClientPage address={params.address} />
      </AptPriceContextProvider>
    </div>
  );
}
