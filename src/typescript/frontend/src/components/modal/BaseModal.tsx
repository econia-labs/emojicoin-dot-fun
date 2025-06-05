import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Arrow } from "components/svg";
import React, { Fragment, type PropsWithChildren } from "react";

import ClosePixelated from "@/icons/ClosePixelated";

export const BaseModal: React.FC<
  PropsWithChildren<{
    showCloseButton?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
  }>
> = ({ showCloseButton, showBackButton, onBack, isOpen, onClose, children, className }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" open={isOpen} onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              className={`${className} max-w-4xl transform border bg-transparent align-middle shadow-xl`}
            >
              {showBackButton ? (
                <DialogTitle as="div">
                  <div
                    className="group absolute left-0 top-0 !z-50 flex h-[70px] w-[70px] cursor-pointer items-center"
                    onClick={() => (onBack ? onBack() : null)}
                  >
                    <div className="m-auto flex rotate-180">
                      <Arrow
                        width={17}
                        height={18}
                        className="fill-black transition-all group-hover:h-[19px] group-hover:w-[18px]"
                      />
                    </div>
                  </div>
                </DialogTitle>
              ) : null}
              {showCloseButton ? (
                <DialogTitle as="div">
                  <div
                    className="group absolute right-0 top-0 !z-50 flex h-[70px] w-[70px] cursor-pointer items-center justify-center"
                    onClick={onClose}
                  >
                    <ClosePixelated className="h-[16px] w-[15px] text-black transition-all group-hover:h-[19px] group-hover:w-[18px]" />
                  </div>
                </DialogTitle>
              ) : null}
              {children}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
