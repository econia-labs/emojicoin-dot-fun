import { type ReactNode } from "react";

export const XprPopup = ({
  dpr,
  wpr,
  apr,
}: {
  dpr: string;
  wpr: string;
  apr: string;
}): ReactNode => (
  <>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>DPR:</span>
        <span>{dpr}</span>
      </div>
    </div>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>WPR:</span>
        <span>{wpr}</span>
      </div>
    </div>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>APR:</span>
        <span>{apr}</span>
      </div>
    </div>
  </>
);
