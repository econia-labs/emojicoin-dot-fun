import { type NAVIGATE_LINKS } from "../../constants";

export interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean) => void;
  linksForCurrentPage: (typeof NAVIGATE_LINKS)[number][];
  offsetHeight: number;
}
