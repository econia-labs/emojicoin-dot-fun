import { useAppDispatch } from "store/store";
import { showModal } from "store/modal";

import { Button } from "components";

import { TestModalProps } from "./components/test-modal/types";
import { ModalProps } from "store/modal/types";

export default {
  title: "Components/Modals",
};

export const Modals: React.FC = () => {
  const dispatch = useAppDispatch();
  const rootId = "modal-story";

  const onShowModal = () => {
    const _showModal = showModal as ModalProps<TestModalProps>;

    dispatch(_showModal({ modalName: "testModal", rootId, props: { title: "Test" } }));
  };

  return (
    <div id={rootId}>
      <Button onClick={() => onShowModal()}>Show test modal</Button>
    </div>
  );
};
