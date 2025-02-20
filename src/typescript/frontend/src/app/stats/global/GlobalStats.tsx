import { type AnyEmoji } from "@sdk/emoji_data";
import { type GlobalStats } from "./calculate-stats";
import { KeyAndValue } from "./KeyAndValue";

export const GlobalStatsComponent = (
  props: GlobalStats & { lastChatMessageEmojis: AnyEmoji[] }
) => {
  return (
    <div className="flex flex-col w-full">
      <KeyAndValue field="Number of markets" value={props.numMarkets} />
      <KeyAndValue field="Number of markets post-bonding curve" value={props.numPostBondingCurve} />
      <KeyAndValue field="Number of markets in bonding curve" value={props.numInBondingCurve} />
      <KeyAndValue
        field="Number of markets >= 100 APT mkt cap"
        value={props.numSignificantMarketCap}
      />
      <KeyAndValue field="Number of markets < 100 APT mkt cap" value={props.numLowMarketCap} />
      <br />
      <KeyAndValue field="Daily volume (rolling 24h)" value={props.cumulativeDailyVolume} apt />
      <KeyAndValue field="Number of markets active in last 24h" value={props.numRecentlyActive} />
      <KeyAndValue field="Number of markets traded in last 24h" value={props.numRecentlyTraded} />
      <br />
      <KeyAndValue field="Last state bump" value={props.lastBumpTime} />
      <KeyAndValue field="Last market registered" value={props.lastMarketRegistered} />
      <KeyAndValue field="Last market register time" value={props.lastMarketRegister} />
      <KeyAndValue
        field="Last chat message"
        value={
          props.lastChatMessageEmojis.length > 8
            ? props.lastChatMessageEmojis.slice(0, 4).join("") +
              "..." +
              props.lastChatMessageEmojis.slice(0, 4).join("")
            : props.lastChatMessageEmojis.join("")
        }
        className=""
      />
      <br />
      <KeyAndValue field="Cumulative quote volume" value={props.cumulativeQuoteVolume} apt />
      <KeyAndValue field="Total quote locked" value={props.totalQuoteLocked} apt />
      <KeyAndValue field="Total value locked" value={props.totalValueLocked} apt />
      <KeyAndValue field="Fully diluted value" value={props.fullyDilutedValue} apt />
      <KeyAndValue field="Cumulative integrator fees" value={props.cumulativeIntegratorFees} apt />
      <KeyAndValue field="Total market cap" value={props.marketCap} apt />
      <KeyAndValue field="Total number of interactions" value={props.globalNonce} />
      <br />
    </div>
  );
};
