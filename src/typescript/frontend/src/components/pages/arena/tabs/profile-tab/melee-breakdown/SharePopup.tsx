import { Share } from "lucide-react";

import Popup from "@/components/popup";

export default function SharePopup({
  setIsPnlModalOpen,
}: {
  setIsPnlModalOpen: (open: boolean) => void;
}) {
  return (
    <Popup content={"Share your PNL with the world!"}>
      <Share
        className="text-ec-blue cursor-pointer"
        size={16}
        onClick={(e) => {
          e.preventDefault();
          setIsPnlModalOpen(true);
        }}
      />
    </Popup>
  );
}
