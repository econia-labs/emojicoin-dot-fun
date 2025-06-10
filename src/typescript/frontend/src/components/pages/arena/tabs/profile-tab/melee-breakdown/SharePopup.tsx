import type { ClassValue } from "clsx";
import { cn } from "lib/utils/class-name";
import { Share } from "lucide-react";

import Popup from "@/components/popup";
import usePnlModalStore from "@/store/pnl-modal/store";

export default function SharePopup({ className }: { className?: ClassValue }) {
  const setIsPnlModalOpen = usePnlModalStore((s) => s.setOpen);

  return (
    <Popup content={"Share your PNL with the world!"}>
      <Share
        className={cn("text-ec-blue cursor-pointer", className)}
        size={16}
        onClick={(e) => {
          // Prevent default to avoid the popup appearing on mobile while the modal is open. Without this,
          // the popup text won't close, because on mobile, `<Popup />` actually uses `Popover` internally, which
          // is a tooltip on click, and remains indefinitely.
          e.preventDefault();
          setIsPnlModalOpen(true);
        }}
      />
    </Popup>
  );
}
