import {
  APTOS_CONNECT_ACCOUNT_URL,
  isAptosConnectWallet,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Badge } from "components/Badge";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { EXTERNAL_LINK_PROPS, Link } from "components/link";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useWalletModal } from "context/wallet-context/WalletModalContext";
import { AnimatePresence, useAnimationControls } from "framer-motion";
import { Copy, LogOut, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { ROUTES } from "router/routes";

import useIsUserGeoblocked from "@/hooks/use-is-user-geoblocked";

import MobileMenuItem from "../mobile-menu-item/mobile-menu-item";
import { slideVariants } from "./animations";
import AnimatedDropdownItem from "./components/animated-dropdown-item";
import { MobileSocialLinks } from "./components/mobile-social-links";
import { MobileMenuWrapper, StyledMotion } from "./styled";
import type { MobileMenuProps } from "./types";

const IconClass = "w-[22px] h-[22px] m-auto ml-[3ch] mr-[1.5ch] text-ec-blue";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  setIsOpen,
  linksForCurrentPage,
}) => {
  const { wallet, account, disconnect } = useWallet();
  const router = useRouter();
  const { copyAddress } = useAptos();
  const { openWalletModal } = useWalletModal();
  const subMenuControls = useAnimationControls();
  const borderControls = useAnimationControls();
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "clip";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleCloseSubMenu = useCallback(async () => {
    setSubMenuOpen(false);
    await borderControls.start({ opacity: 0 });
    await subMenuControls.start({ height: 0 });
  }, [subMenuControls, borderControls]);

  useEffect(() => {
    if (!isOpen) {
      handleCloseSubMenu();
    }
    /* eslint-disable-next-line */
  }, [isOpen]);

  useEffect(() => {
    if (!account) {
      handleCloseSubMenu();
    }
    /* eslint-disable-next-line */
  }, [account]);

  const handleCloseMobileMenu = async () => {
    await handleCloseSubMenu();
    setIsOpen(false);
  };

  const subMenuOnClick = async () => {
    if (!account) {
      openWalletModal();
    } else {
      if (!subMenuOpen) {
        setSubMenuOpen(true);
        await borderControls.start({
          opacity: 1,
          transition: { delay: 0, duration: 0 },
        });
        await subMenuControls.start({ height: 40 });
      } else {
        const a = borderControls.start({ opacity: 0 });
        const b = subMenuControls.start({ height: 0 });
        await Promise.all([a, b]);
        setSubMenuOpen(false);
      }
    }
  };
  const geoblocked = useIsUserGeoblocked();

  return (
    <StyledMotion initial="hidden" animate={isOpen ? "visible" : "hidden"} variants={slideVariants}>
      <MobileMenuWrapper>
        <div className="flex flex-col w-full">
          {!geoblocked && (
            <ButtonWithConnectWalletFallback
              className={"w-full"}
              mobile={true}
              onClick={subMenuOnClick}
              arrow
            />
          )}
          <AnimatePresence>
            {subMenuOpen && (
              <>
                {wallet && isAptosConnectWallet(wallet) && (
                  <a
                    key="aptos-connect-dropdown"
                    href={APTOS_CONNECT_ACCOUNT_URL}
                    {...EXTERNAL_LINK_PROPS}
                  >
                    <AnimatedDropdownItem
                      title="Account"
                      icon={<User className={IconClass} />}
                      controls={subMenuControls}
                    />
                  </a>
                )}
                <AnimatedDropdownItem
                  key="my-emojicoins-dropdown"
                  onClick={() => {
                    router.push(`${ROUTES.wallet}/${account?.address}`);
                    setIsOpen(false);
                  }}
                  title="My emojicoins"
                  icon={<UserRound className={IconClass} />}
                  controls={subMenuControls}
                />
                <AnimatedDropdownItem
                  key="copy-address-dropdown"
                  title="Copy address"
                  icon={<Copy className={IconClass} />}
                  onClick={copyAddress}
                  controls={subMenuControls}
                />
                <AnimatedDropdownItem
                  key="disconnect-dropdown"
                  title="Disconnect"
                  icon={<LogOut className={IconClass} />}
                  onClick={disconnect}
                  controls={subMenuControls}
                />
              </>
            )}
          </AnimatePresence>
          {linksForCurrentPage.map(({ title, path }, i) => {
            return (
              <Link
                key={title}
                href={path}
                target={path.startsWith("https://") ? "_blank" : undefined}
                onClick={handleCloseMobileMenu}
                width="100%"
              >
                <MobileMenuItem
                  title={title}
                  noBorder={i === linksForCurrentPage.length - 1}
                  pill={
                    title === "arena"
                      ? {
                          className: "flex flex-row items-center gap-[.5em]",
                          pill: <Badge color="econiaBlue">NEW</Badge>,
                        }
                      : undefined
                  }
                />
              </Link>
            );
          })}
        </div>

        <div className="flex fixed bottom-[60px] justify-center w-full">
          <MobileSocialLinks />
        </div>
      </MobileMenuWrapper>
    </StyledMotion>
  );
};
