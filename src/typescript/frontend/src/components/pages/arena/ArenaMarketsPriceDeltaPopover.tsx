import Popup from "@/components/popup";
import { PriceDelta } from "@/components/price-feed/inner";

const ArenaMarketsPriceDeltaPopover = ({ delta }: { delta?: number | null }) =>
  typeof delta === "number" && (
    <Popup content={<span>The change in price since the start of the melee</span>}>
      {/* Needs the wrapper div or the popup/popover won't work. */}
      <div className="flex">
        <PriceDelta className="m-auto px-2 text-xl lg:text-2xl xl:text-3xl" delta={delta} />
      </div>
    </Popup>
  );

export default ArenaMarketsPriceDeltaPopover;
