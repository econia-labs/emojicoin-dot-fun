import { ModalNames } from "store/modal";
import { TestModal } from "./components";

export const components = {
  [ModalNames.testModal]: () => <TestModal />,
};
