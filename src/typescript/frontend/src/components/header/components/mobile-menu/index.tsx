import React, { useCallback, useEffect, useState } from "react";

import { MobileMenuInner, MobileMenuWrapper, StyledMotion } from "./styled";
import { EXTERNAL_LINK_PROPS, Link } from "components/link";
import { Flex } from "@containers";
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
import { motion, useAnimationControls } from "framer-motion";
import AnimatedDropdownItem from "./components/animated-dropdown-item";
import AnimatedBorder from "./components/animated-dropdown-item/AnimatedBorder";

const IconClass = "w-[22px] h-[22px] m-auto ml-[3ch] mr-[1.5ch]";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  setIsOpen,
  linksForCurrentPage,
  offsetHeight,
}) => {
  const { wallet, account, disconnect } = useWallet();
  const { copyAddress } = useAptos();
  const { openWalletModal } = useWalletModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleCloseMobileMenu = () => {
    setIsOpen(false);
  };

  const subMenuControls = useAnimationControls();
  const borderControls = useAnimationControls();
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  const handleCloseSubMenu = useCallback(() => {
    setSubMenuOpen(false);
    borderControls.start({ opacity: 0 });
    subMenuControls.start({ height: 0 });
  }, [subMenuControls, borderControls]);

  useEffect(() => {
    if (!account) {
      handleCloseSubMenu();
    }
    /* eslint-disable-next-line */
  }, [account]);

  const subMenuOnClick = async () => {
    if (!account) {
      openWalletModal();
    } else {
      if (!subMenuOpen) {
        await borderControls.start({
          opacity: 1,
          transition: { delay: 0, duration: 0 },
        });
        await subMenuControls.start({ height: 40 });
        setSubMenuOpen(true);
      } else {
        const a = borderControls.start({ opacity: 0 });
        const b = subMenuControls.start({ height: 0 });
        await Promise.all([a, b]);
        setSubMenuOpen(false);
      }
    }
  };

  return (
    <StyledMotion
      initial="hidden"
      animate={isOpen ? "visible" : "hidden"}
      variants={slideVariants}
      offsetHeight={offsetHeight}
    >
      <MobileMenuWrapper offsetHeight={offsetHeight}>
        <MobileMenuInner>
          <ButtonWithConnectWalletFallback
            className="w-full"
            mobile={true}
            onClick={subMenuOnClick}
          />
          {wallet && isAptosConnectWallet(wallet) && (
            <a href={APTOS_CONNECT_ACCOUNT_URL} {...EXTERNAL_LINK_PROPS}>
              <AnimatedDropdownItem
                title="Account"
                icon={<User className={IconClass} />}
                controls={subMenuControls}
                borderControls={borderControls}
              />
            </a>
          )}
          <AnimatedDropdownItem
            title="Copy address"
            icon={<Copy className={IconClass} />}
            onClick={copyAddress}
            controls={subMenuControls}
            borderControls={borderControls}
          />
          <AnimatedDropdownItem
            title="Disconnect"
            icon={<LogOut className={IconClass} />}
            onClick={disconnect}
            controls={subMenuControls}
            borderControls={borderControls}
          />
          {linksForCurrentPage.map(({ title, path }, i) => {
            return (
              <Link key={title} href={path} onClick={handleCloseMobileMenu} width="100%">
                <MobileMenuItem title={title} borderBottom={i !== linksForCurrentPage.length - 1} />
              </Link>
            );
          })}
        </MobileMenuInner>

        <Flex position="absolute" bottom="60px" justifyContent="center" width="100%">
          <MobileSocialLinks />
        </Flex>
      </MobileMenuWrapper>
    </StyledMotion>
  );
};
