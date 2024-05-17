import { ModalNames } from "store/modal";
import TestModal from "./components/test-modal";
import WalletModal from "./components/wallet-modal";

export const components = {
  [ModalNames.testModal]: () => <TestModal />,
  [ModalNames.walletModal]: () => <WalletModal />,
};
