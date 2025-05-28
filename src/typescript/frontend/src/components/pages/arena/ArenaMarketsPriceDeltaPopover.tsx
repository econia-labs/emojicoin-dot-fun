import Popup from "@/components/popup";
import { PriceDelta } from "@/components/price-feed/inner";

const ArenaMarketsPriceDeltaPopover = ({ delta }: { delta: number | null }) =>
  delta !== null && (
    <Popup content={<span>The change in price since the start of the melee</span>}>
      {/* Needs the wrapper div or the popup/popover won't work. */}
      <div className="flex">
        <PriceDelta className="text-xl lg:text-2xl xl:text-3xl px-2 m-auto" delta={delta} />
      </div>
    </Popup>
  );

export default ArenaMarketsPriceDeltaPopover;
