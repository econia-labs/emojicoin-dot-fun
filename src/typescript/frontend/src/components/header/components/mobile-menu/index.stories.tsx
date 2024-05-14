import { MobileMenu } from "./index";
import { useState } from "react";
import { NAVIGATE_LINKS } from "../../constants";

export default {
  title: "Components/Header/MobileMenus",
};

export const MobileMenus: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <MobileMenu
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      linksForCurrentPage={NAVIGATE_LINKS}
      offsetHeight={93}
      walletHandler={() => {}}
    />
  );
};
