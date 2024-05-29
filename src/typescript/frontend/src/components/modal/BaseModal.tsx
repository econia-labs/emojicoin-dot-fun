import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import React, { Fragment, type PropsWithChildren } from "react";
import { CloseIconWithHover } from "components/svg";
import ChevronLeftIcon from "components/svg/icons/ChevronLeft";

export const BaseModal: React.FC<
  PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    showCloseButton?: boolean;
    showBackButton?: boolean;
    className?: string;
  }>
> = ({ isOpen, onClose, onBack, showBackButton, showCloseButton, children, className }) => {
  const [hoveringOnCloseButton, setHoveringOnCloseButton] = React.useState(false);
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" open={isOpen} onClose={onClose}>
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
              className={`w-full
              ${className} ${
                hoveringOnCloseButton ? "" : ""
              } max-w-4xl transform border bg-black align-middle shadow-xl transition-all`}
            >
              <DialogTitle as="div">
                {showBackButton && (
                  <div
                    className="absolute left-[23px] top-[20px] flex cursor-pointer items-center justify-center gap-[9.53px] font-roboto-mono text-sm font-normal text-neutral-500 transition-all hover:text-white"
                    onClick={onBack}
                  >
                    <ChevronLeftIcon width={11} height={10} />
                    Back
                  </div>
                )}
                {showCloseButton && (
                  <div
                    className={`absolute right-0 top-0 !z-50 flex h-[50px] w-[50px] cursor-pointer items-center justify-center border-b border-l transition-all [&>svg>path]:stroke-neutral-500 [&>svg>path]:transition-all [&>svg>path]:hover:stroke-neutral-100 ${
                      hoveringOnCloseButton
                        ? ""
                        : ""
                    }`}
                    onClick={onClose}
                    onMouseEnter={() => setHoveringOnCloseButton(true)}
                    onMouseLeave={() => setHoveringOnCloseButton(false)}
                  >
                    <CloseIconWithHover />
                  </div>
                )}
              </DialogTitle>
              {children}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
