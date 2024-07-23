import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExplorerLink } from "components/link/component";
import { motion } from "framer-motion";
import { APTOS_NETWORK } from "lib/env";

export const CongratulationsToast = ({ transactionHash }: { transactionHash: string }) => {
  const { network } = useWallet();
  return (
    <div className="flex flex-col text-center">
      <motion.span
        animate={{
          filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"],
          transition: {
            repeat: Infinity,
            duration: 2,
            repeatType: "reverse",
          },
        }}
        className="text-ec-blue font-forma-bold"
      >
        {"Congratulations!"}
      </motion.span>
      <span>{"You won 1 APT."}</span>
      <div className="mt-[1ch]">
        <span>{"View the transaction "}</span>
        <ExplorerLink
          className="font-forma inline font-bold text-orange-500 drop-shadow-text"
          network={network?.name ?? APTOS_NETWORK}
          value={transactionHash}
          type="transaction"
        >
          {"here."}
        </ExplorerLink>
      </div>
    </div>
  );
};
