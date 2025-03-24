import {
  AptosPrivacyPolicy,
  getAptosConnectWallets,
  partitionWallets,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import EmojicoinLogo from "@icons/EmojicoinLogo";
import { BaseModal } from "components/modal/BaseModal";
import { Arrow } from "components/svg";
import { DEFAULT_TOAST_CONFIG } from "const";
import { isSupportedWallet, WalletItem, walletSort } from "context/wallet-context/WalletItem";
import { motion, type MotionProps, type PanInfo } from "framer-motion";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "react-toastify";

import { AptosConnectWalletRow } from "./AptosConnectWalletRow";
import LearnMoreSlideshow, { SLIDE_INDICES } from "./LearnMoreSlideshow";

const WalletItemClassName =
  "relative flex h-[45px] w-full items-center p-4 text-neutral-600" +
  "transition-all hover:text-ec-blue hover:bg-[#0000000E] " +
  "text-black group";

export const FirstSlide = ({
  slide,
  setOpen,
  increment,
  ...props
}: {
  slide: SlideState;
  setOpen: Dispatch<SetStateAction<boolean>>;
  increment: () => void;
}) => {
  const { connect, disconnect, wallets = [], wallet: activeWallet } = useWallet();
  // The Aptos Connect social login wallets.
  const { aptosConnectWallets } = getAptosConnectWallets(wallets);
  // The wallets we specify as `optIn` in the provider.
  const { defaultWallets, moreWallets } = partitionWallets(wallets);

  return slide.idx === 0 ? (
    <div className="px-[46px] py-[25.5px]" {...props}>
      {/* Favicon + Log in or sign up with ... */}
      <div className="flex flex-col text-center font-pixelar text-xl text-black uppercase">
        <EmojicoinLogo width={40} height={40} className="m-auto mb-2" />
        <span>Log in or sign up</span>
        <span>With social + Aptos Connect</span>
      </div>

      {/* Aptos Connect Wallets */}

      <div className="flex flex-col pt-2">
        {aptosConnectWallets.map((wallet) => (
          <AptosConnectWalletRow
            key={wallet.name}
            wallet={wallet}
            onConnect={() => setOpen(false)}
            onClick={() => setOpen(false)}
          />
        ))}
      </div>

      {/* Learn more */}
      <div className="flex flex-row py-3 text-md text-dark-gray uppercase">
        <div className="flex flex-row m-auto">
          <span>Learn more about&nbsp;</span>
          <div className="text-black flex flex-row hover:cursor-pointer" onClick={increment}>
            <span>Aptos Connect</span>
            <Arrow width={10} className="ml-[0.5ch] mb-[0.5px]" />
          </div>
        </div>
      </div>

      {/* Aptos Privacy Policy */}

      <AptosPrivacyPolicy className="flex flex-col items-center">
        <p className="text-sm leading-5 text-dark-gray">
          <AptosPrivacyPolicy.Disclaimer />{" "}
          <AptosPrivacyPolicy.Link className="text-black underline underline-offset-4" />
          <span className="text-dark-gray">.</span>
        </p>
        <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-dark-gray" />
      </AptosPrivacyPolicy>

      <div className="flex items-center gap-4 py-4 uppercase mb-[1.5ch]">
        <div className="h-[1px] w-full bg-black text-black" />
        <span className="text-black">Or</span>
        <div className="h-[1px] w-full bg-black" />
      </div>

      {/* Preferred Wallets */}

      <div className="flex flex-col divide-y-2 divide-dotted divide-slate-800 pb-2">
        <span>{""}</span>
        {defaultWallets
          .concat(moreWallets)
          .sort(walletSort)
          .filter((w) => !aptosConnectWallets.map((w) => w.name).includes(w.name))
          .filter((w) => isSupportedWallet(w.name))
          .map((wallet) => (
            <WalletItem
              wallet={wallet}
              key={wallet.name}
              className={WalletItemClassName}
              onClick={() => {
                try {
                  if (wallet.name === activeWallet?.name) {
                    disconnect();
                  } else {
                    connect(wallet.name);
                  }
                } catch (e) {
                  if (e instanceof Error) {
                    toast.error(e.message, {
                      ...DEFAULT_TOAST_CONFIG,
                    });
                  }
                } finally {
                  setOpen(false);
                }
              }}
            ></WalletItem>
          ))}
        <span>{""}</span>
      </div>
    </div>
  ) : (
    <></>
  );
};

export type SlideState = {
  idx: number;
  direction: "left" | "right";
};

export const WalletModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  // Direction isn't currently used, but could be if we ever decide to animate the slides
  // as a draggable carousel slider with AnimatePresence.
  const [slide, setSlide] = useState<SlideState>({ idx: 0, direction: "left" });

  const reset = () => {
    setSlide({ idx: 0, direction: "left" });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => reset(), 100);
  };

  const increment = () => {
    setSlide(({ idx: curr }) => {
      if (curr === SLIDE_INDICES.at(-1)!) {
        return {
          idx: 0,
          direction: "right",
        };
      }
      return {
        idx: SLIDE_INDICES.at(curr + 1)!,
        direction: "right",
      };
    });
  };

  const decrement = () => {
    setSlide(({ idx: curr }) => {
      return { idx: SLIDE_INDICES.at(curr - 1)!, direction: "left" };
    });
  };

  const dragProps: MotionProps = {
    drag: slide.idx !== 0 ? "x" : false,
    dragSnapToOrigin: slide.idx !== 0,
    dragConstraints: { left: -200, right: 200 },
    onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const SWIPE_CONFIDENCE_THRESHOLD = 10000;
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      const swipePower = Math.abs(offset) * velocity;

      if (swipePower < -SWIPE_CONFIDENCE_THRESHOLD) {
        increment();
      } else if (swipePower > SWIPE_CONFIDENCE_THRESHOLD) {
        decrement();
      }
    },
  };

  return (
    <BaseModal
      className="w-[430px]"
      isOpen={open}
      onClose={handleClose}
      onBack={reset}
      showBackButton={slide.idx !== 0}
      showCloseButton={true}
    >
      <motion.div className="bg-ec-blue radii-xs" {...dragProps}>
        <FirstSlide slide={slide} setOpen={setOpen} increment={increment} />
        <LearnMoreSlideshow
          slide={slide.idx}
          setSlide={setSlide}
          onLeftArrow={decrement}
          onRightArrow={increment}
          increment={increment}
          decrement={decrement}
          reset={reset}
        />
      </motion.div>
    </BaseModal>
  );
};
