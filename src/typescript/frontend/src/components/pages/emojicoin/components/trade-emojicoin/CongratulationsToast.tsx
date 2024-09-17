import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ExplorerLink } from "components/link/component";
import { motion } from "framer-motion";
import { APTOS_NETWORK } from "lib/env";
import { Text } from "components/text";

export const CongratulationsToast = ({ transactionHash }: { transactionHash: string }) => {
  const { network } = useWallet();
  return (
    <div className="flex flex-col text-center">
      <Text textScale="pixelHeading2">🎉</Text>
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
        <Text textScale="pixelHeading2" textTransform="uppercase">
          Congratulations!
        </Text>
      </motion.span>
      <Text textScale="display5" textTransform="uppercase" color="econiaBlue">
        {"You won 1 APT!"}
      </Text>
      <div className="mt-[1ch] w-[100%] flex flex-row justify-center mb-[15px]">
        <Text color="darkGray" textTransform="uppercase">
          View the transaction&nbsp;
        </Text>
        <ExplorerLink
          className="font-forma inline font-bold text-orange-500 drop-shadow-text"
          network={network?.name ?? APTOS_NETWORK}
          value={transactionHash}
          type="transaction"
        >
          <Text textTransform="uppercase" color="darkGray" style={{ textDecoration: "underline" }}>
            here
          </Text>
        </ExplorerLink>
        <Text color="darkGray" textTransform="uppercase">
          .
        </Text>
      </div>
    </div>
  );
};
