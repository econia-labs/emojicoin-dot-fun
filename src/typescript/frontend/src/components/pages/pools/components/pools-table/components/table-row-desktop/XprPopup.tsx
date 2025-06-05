import type { ReactNode } from "react";

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
      <div className="flex justify-between gap-[0.2rem]">
        <span>DPR:</span>
        {dpr}
      </div>
    </div>
    <div>
      <div className="flex justify-between gap-[0.2rem]">
        <span>WPR:</span>
        {wpr}
      </div>
    </div>
    <div>
      <div className="flex justify-between gap-[0.2rem]">
        <span>APR:</span>
        {apr}
      </div>
    </div>
  </>
);
