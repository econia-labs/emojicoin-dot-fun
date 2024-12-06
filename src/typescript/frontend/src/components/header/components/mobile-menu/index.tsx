import React, { useCallback, useEffect, useState } from "react";
import { MobileMenuInner, MobileMenuWrapper, StyledMotion } from "./styled";
import { EXTERNAL_LINK_PROPS, Link } from "components/link";
import { MobileSocialLinks } from "./components/mobile-social-links";
import { MobileMenuItem } from "../index";
import { type MobileMenuProps } from "./types";
import { slideVariants } from "./animations";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  APTOS_CONNECT_ACCOUNT_URL,
  isAptosConnectWallet,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Copy, LogOut, User } from "lucide-react";
import { useWalletModal } from "context/wallet-context/WalletModalContext";
import { AnimatePresence, useAnimationControls } from "framer-motion";
import AnimatedDropdownItem from "./components/animated-dropdown-item";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";

const IconClass = "w-[22px] h-[22px] m-auto ml-[3ch] mr-[1.5ch]";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  setIsOpen,
  linksForCurrentPage,
}) => {
  const { wallet, account, disconnect } = useWallet();
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

  const handleCloseSubMenu = useCallback(async () => {
    setSubMenuOpen(false);
    await borderControls.start({ opacity: 0 });
    await subMenuControls.start({ height: 0 });
  }, [subMenuControls, borderControls]);

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
        <MobileMenuInner>
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
                      borderControls={borderControls}
                    />
                  </a>
                )}
                <AnimatedDropdownItem
                  key="copy-address-dropdown"
                  title="Copy address"
                  icon={<Copy className={IconClass} />}
                  onClick={copyAddress}
                  controls={subMenuControls}
                  borderControls={borderControls}
                />
                <AnimatedDropdownItem
                  key="disconnect-dropdown"
                  title="Disconnect"
                  icon={<LogOut className={IconClass} />}
                  onClick={disconnect}
                  controls={subMenuControls}
                  borderControls={borderControls}
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
                <MobileMenuItem title={title} borderBottom={i !== linksForCurrentPage.length - 1} />
              </Link>
            );
          })}
        </MobileMenuInner>

        <div className="flex fixed bottom-[60px] justify-center w-full">
          <MobileSocialLinks />
        </div>
      </MobileMenuWrapper>
    </StyledMotion>
  );
};
