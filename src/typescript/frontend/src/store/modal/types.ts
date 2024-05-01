import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { ROUTES } from "router/routes";

export type ModalState<T> = {
  modalName: null | keyof typeof ModalNames;
  rootId: (typeof ROUTES)[keyof typeof ROUTES] | "modal-story" | "modal";
  props?: T;
  clickOutsideHandler?: (() => void) | null;
};

export type ShowModalProps<T> = {
  modalName: ModalState<T>["modalName"];
  rootId?: ModalState<T>["rootId"];
  props?: T;
  clickOutsideHandler?: ModalState<T>["clickOutsideHandler"];
};

export enum ModalNames {
  testModal = "testModal",
}

export interface ModalProps<T> extends ActionCreatorWithPayload<ShowModalProps<T>, string> {}
