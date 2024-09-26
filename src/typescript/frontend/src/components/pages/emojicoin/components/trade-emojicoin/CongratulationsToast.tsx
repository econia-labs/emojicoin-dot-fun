import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { type AnyNumberString } from "@sdk/types/types";
import { ExplorerLink } from "components/link/component";
import { APTOS_NETWORK } from "lib/env";
import { toDisplayCoinDecimals } from "lib/utils/decimals";

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
      <span className="text-7xl p-[20px]">🎉</span>
      <div className="flex flex-col text-center">
        <span className="font-pixelar text-5xl uppercase">
          Congratulations!
        </span>
        <span className="font-forma text-2xl uppercase text-ec-blue">
          <span>{`You won ${amountString} APT.`}</span>
        </span>
        <div className="w-[100%] flex flex-row justify-center mb-[15px]">
          <span className="text-dark-gray text-l uppercase">
            View the transaction&nbsp;
          </span>
          <ExplorerLink
            network={network?.name ?? APTOS_NETWORK}
            value={transactionHash}
            type="transaction"
          >
            <span className="text-dark-gray text-l uppercase underline">
              here
            </span>
          </ExplorerLink>
          <span className="text-dark-gray text-l uppercase">
            .
          </span>
        </div>
      </div>
    </div>
  );
};
