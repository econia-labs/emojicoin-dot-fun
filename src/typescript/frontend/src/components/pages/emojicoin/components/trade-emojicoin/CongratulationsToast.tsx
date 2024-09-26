import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExplorerLink } from "components/link/component";
import { APTOS_NETWORK } from "lib/env";

export const CongratulationsToast = ({ transactionHash }: { transactionHash: string }) => {
  const { network } = useWallet();
  return (
    <div className="flex flex-col text-center">
      <span className="text-7xl p-[20px]">🎉</span>
      <div className="flex flex-col text-center">
        <span className="font-pixelar text-5xl uppercase">
          Congratulations!
        </span>
        <span className="font-forma text-2xl uppercase text-ec-blue">
          {"You won 1 APT!"}
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
