import { ModalNames } from "store/modal";
import TestModal from "./components/test-modal";

export const components = {
  [ModalNames.testModal]: () => <TestModal />,
};
