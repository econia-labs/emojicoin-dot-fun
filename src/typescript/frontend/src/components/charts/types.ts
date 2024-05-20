import { type MarketMetadataWithName } from "@/sdk/queries/markets";
import { type Candlesticks, type Markets } from "lib/queries/get-markets";

export interface ChartDataProps {
  markets: Markets;
  market?: MarketMetadataWithName;
  candlesticks?: Candlesticks;
}

export interface ChartContainerProps extends ChartDataProps {
  isScriptReady: boolean;
}
