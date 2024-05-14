import React, {useState} from "react";
import { Outlet } from "react-router-dom";

import { useMatchBreakpoints } from "hooks";

import { Header, Footer, Column } from "components";

const MainOutlet: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isDesktop } = useMatchBreakpoints();

    const isMobileMenuOpen = isOpen && !isDesktop;

  return (
    <Column maxWidth="100vw" px="0px" height="100vh" overflowX="hidden">
      <Header isOpen={isMobileMenuOpen} setIsOpen={setIsOpen} />
      <Outlet />
      <Footer />
    </Column>
  );
};

export default MainOutlet;
