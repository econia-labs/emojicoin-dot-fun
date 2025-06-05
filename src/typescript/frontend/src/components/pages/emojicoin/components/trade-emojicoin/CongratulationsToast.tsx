import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { APTOS_NETWORK } from "lib/env";
import { toDisplayCoinDecimals } from "lib/utils/decimals";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import type { AnyNumberString } from "@/sdk/types/types";

export const CongratulationsToast = ({
  transactionHash,
  amount,
}: {
  transactionHash: string;
  amount: AnyNumberString;
}) => {
  const { network } = useWallet();
  const amountString = toDisplayCoinDecimals({ num: amount, decimals: 2 });
  return (
    <div className="flex flex-col text-center">
      <Emoji className="p-[20px] text-7xl" emojis={emoji("party popper")} />
      <div className="flex flex-col text-center">
        <span className="font-pixelar text-5xl uppercase">Congratulations!</span>
        <span className="font-forma text-2xl uppercase text-ec-blue">
          <span>{`You won ${amountString} APT.`}</span>
        </span>
        <div className="mb-[15px] flex w-[100%] flex-row justify-center">
          <span className="text-l uppercase text-dark-gray">View the transaction&nbsp;</span>
          <ExplorerLink
            network={network?.name ?? APTOS_NETWORK}
            value={transactionHash}
            type="transaction"
          >
            <span className="text-l uppercase text-dark-gray underline">here</span>
          </ExplorerLink>
          <span className="text-l uppercase text-dark-gray">.</span>
        </div>
      </div>
    </div>
  );
};
