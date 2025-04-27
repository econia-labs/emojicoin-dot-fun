import { useUserSettings } from "context/event-store-context";

import { Switch } from "@/components/ui/Switch";

import type { SortHomePageDropdownProps } from "./SortHomePageDropdown";
import SortHomePageDropdown from "./SortHomePageDropdown";

export default function SortAndAnimate({ sortMarketsBy, onSortChange }: SortHomePageDropdownProps) {
  const animate = useUserSettings((s) => s.animate);
  const toggleAnimate = useUserSettings((s) => s.toggleAnimate);

  return (
    <div className={"flex w-full justify-between md:justify-end py-2 items-center"}>
      <SortHomePageDropdown sortMarketsBy={sortMarketsBy} onSortChange={onSortChange} />
      <div className="flex flex-row gap-3">
        <span className=" med-pixel-text text-light-gray uppercase">Animate: </span>
        <Switch checked={animate} onCheckedChange={toggleAnimate} />
      </div>
    </div>
  );
}
