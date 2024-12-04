import { type ReactNode } from "react";

export const XprPopup = ({
  dpr,
  wpr,
  apr,
}: {
  dpr: JSX.Element;
  wpr: JSX.Element;
  apr: JSX.Element;
}): ReactNode => (
  <>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>DPR:</span>
        {dpr}
      </div>
    </div>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>WPR:</span>
        {wpr}
      </div>
    </div>
    <div>
      <div className="flex gap-[0.2rem] justify-between">
        <span>APR:</span>
        {apr}
      </div>
    </div>
  </>
);
