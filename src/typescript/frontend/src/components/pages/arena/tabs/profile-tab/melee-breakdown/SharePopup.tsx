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
          e.preventDefault();
          setIsPnlModalOpen(true);
        }}
      />
    </Popup>
  );
}
