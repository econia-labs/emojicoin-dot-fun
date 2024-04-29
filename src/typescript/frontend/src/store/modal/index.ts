import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ModalNames, ModalState, ShowModalProps } from "./types";

const initialState: ModalState<undefined> = {
  modalName: null,
  rootId: "modal",
  props: undefined,
  clickOutsideHandler: null,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showModal: <T>(state: ModalState<T>, action: PayloadAction<ShowModalProps<T>>) => {
      state.modalName = action.payload.modalName;
      state.rootId = action.payload.rootId ? action.payload.rootId : "modal";
      state.props = action.payload.props;
      state.clickOutsideHandler = action.payload.clickOutsideHandler;
    },

    partialUpdateModalProps: <T>(state: ModalState<T>, action: PayloadAction<ShowModalProps<T>["props"]>) => {
      state.props = action.payload ? { ...state.props, ...action.payload } : state.props;
    },

    hideModal: () => initialState,
  },
});

export const { showModal, hideModal, partialUpdateModalProps } = modalSlice.actions;
export { ModalNames };
export default modalSlice;
