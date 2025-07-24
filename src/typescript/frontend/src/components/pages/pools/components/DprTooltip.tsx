import Info from "@/components/info";
import { FlexGap } from "@/components/layout";

export const DprTooltip = () => {
  return (
    <Info>
      <div>
        <FlexGap gap=".2rem" justifyContent="space-between">
          <span>DPR:</span>
          <span>Daily Percentage Return</span>
        </FlexGap>
      </div>
      <div>
        <FlexGap gap=".2rem" justifyContent="space-between">
          <span>WPR:</span>
          <span>Weekly Percentage Return</span>
        </FlexGap>
      </div>
      <div>
        <FlexGap gap=".2rem" justifyContent="space-between">
          <span>APR:</span>
          <span>Annual Percentage Return</span>
        </FlexGap>
      </div>
    </Info>
  );
};
