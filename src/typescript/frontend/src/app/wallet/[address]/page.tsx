// cspell:Word vibing

import { sha3_256 } from "@noble/hashes/sha3";
import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { AptPriceContextProvider } from "context/AptPrice";
import { getAptPrice } from "lib/queries/get-apt-price";
import type { Metadata } from "next";

import { customTruncateAddress, resolveOwnerNameCached } from "../utils";
import UserNotFound from "./error";

type Props = {
  params: { address: string };
};

const descriptions: ((owner: string) => string)[] = [
  (owner) =>
    `peep inside ${owner}'s wallet like it's a situationship. are they holding or just holding on?`,
  (owner) =>
    `watch ${owner}'s trading history like it's a red flag. are they up or emotionally down?`,
  (owner) => `${owner}'s wallet reveals everything. charts, choices, coping mechanisms.`,
  (owner) => `see what ${owner}'s holding. and maybe why they haven't texted back.`,
  (owner) => `scroll ${owner}'s wallet like a breakup playlist. no judgment. just data.`,
];

function generateDescription(owner: string) {
  // Create a deterministic index based on the hash of the owner string input.
  const hash = sha3_256(owner);
  const idx = hash[0] % descriptions.length;
  const interpolate = descriptions[idx];
  return interpolate(owner);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const input = params.address;

  const { name, address } = await resolveOwnerNameCached(input);
  const owner = name ?? (address ? customTruncateAddress(address) : input);

  return {
    title: `${owner}'s wallet`,
    description: generateDescription(owner),
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
