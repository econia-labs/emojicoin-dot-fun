import { cn } from "lib/utils/class-name";
import { type StatsPageProps } from "./StatsPage";
import { type Types, type AnyNumberString } from "@sdk-types";
import { useMemo } from "react";
import { compareBigInt, compareNumber, sum } from "@sdk/utils";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "@icons/AptosBlack";
import { MS_IN_ONE_DAY } from "components/charts/const";
import Big from "big.js";
import { ONE_APT_BIGINT } from "@sdk/const";

const formatter = new Intl.NumberFormat("en-us", { maximumFractionDigits: 2 });
const fmt = (n: number | bigint) => formatter.format(n);

const KeyAndValue = ({
  field,
  value = "undefined",
  className,
  apt = false,
}: {
  field: string;
  value?: AnyNumberString | boolean | Date;
  className?: string;
  apt?: boolean;
}) => (
  <>
    <div
      className={cn(
        "flex flex-row text-white font-forma text-[1rem] leading-[1.25rem] w-full pl-[17.5ch]",
        className
      )}
    >
      <div className="flex m-auto">
        <span className="min-w-[35ch] m-auto">{field}</span>
        <span
          className={`min-w-[35ch] flex flex-row ${
            typeof value === "string"
              ? "text-orange-200"
              : typeof value === "number" || typeof value === "bigint"
                ? Math.floor(Number(value.toString())).toString() === value.toString()
                  ? "text-green"
                  : "text-ec-blue"
                : typeof value === "boolean"
                  ? value
                    ? "text-green"
                    : "text-error"
                  : "text-light-gray"
          }`}
        >
          {typeof value === "string"
            ? `"${value}"`
            : typeof value === "number" || typeof value === "bigint"
              ? fmt(value)
              : typeof value === "boolean"
                ? value.toString()
                : value.toLocaleString()}
          {apt ? <AptosIconBlack className="ml-[5px]" width={"0.85rem"} height={"1rem"} /> : <></>}
        </span>
      </div>
    </div>
  </>
);

export const GlobalStats = (
  props: StatsPageProps & { registryResource: Types["RegistryView"] }
) => {
  const { numMarkets, registryResource, allTimeVolumeData } = props;
  const {
    numPostBondingCurve,
    numInBondingCurve,
    numSignificantMarketCap,
    numLowMarketCap,
    ...data
  } = useMemo(() => {
    const normalizeCoinDecimal = (n: bigint) => Number(toCoinDecimalString(n));
    return {
      cumulativeDailyVolume: normalizeCoinDecimal(
        sum(props.dailyVolumeData.map((v) => v.dailyVolume))
      ),
      numPostBondingCurve: allTimeVolumeData.filter((v) => !v.inBondingCurve).length,
      numInBondingCurve: allTimeVolumeData.filter((v) => v.inBondingCurve).length,
      numSignificantMarketCap: allTimeVolumeData.filter(
        (v) => v.state.instantaneousStats.marketCap >= 100n * ONE_APT_BIGINT
      ).length,
      numLowMarketCap: allTimeVolumeData.filter(
        (v) => v.state.instantaneousStats.marketCap < 100n * ONE_APT_BIGINT
      ).length,
      lastBumpTime: allTimeVolumeData
        .map((v) => v.transaction.timestamp)
        .sort((a, b) => compareNumber(a.getTime(), b.getTime()))
        .at(-1),
      numRecentlyActive: allTimeVolumeData.filter(({ transaction }) =>
        Big(transaction.time.toString())
          .div(1000)
          .gt(new Date().getTime() - MS_IN_ONE_DAY)
      ).length,
      numRecentlyTraded: allTimeVolumeData.filter(({ lastSwap }) =>
        Big(lastSwap.time.toString())
          .div(1000)
          .gt(new Date().getTime() - MS_IN_ONE_DAY)
      ).length,
      cumulativeQuoteVolume: normalizeCoinDecimal(registryResource.cumulativeQuoteVolume),
      cumulativeIntegratorFees: normalizeCoinDecimal(registryResource.cumulativeIntegratorFees),
      cumulativeSwaps: registryResource.cumulativeSwaps,
      cumulativeChatMessages: registryResource.cumulativeChatMessages,
      totalQuoteLocked: normalizeCoinDecimal(registryResource.totalQuoteLocked),
      totalValueLocked: normalizeCoinDecimal(registryResource.totalValueLocked),
      marketCap: normalizeCoinDecimal(registryResource.marketCap),
      fullyDilutedValue: normalizeCoinDecimal(registryResource.fullyDilutedValue),
      globalNonce: registryResource.nonce,
      lastMarketRegister: allTimeVolumeData
        .sort((a, b) => compareBigInt(a.market.marketID, b.market.marketID))
        .at(-1)?.transaction.timestamp,
      lastMarketRegistered: allTimeVolumeData
        .sort((a, b) => compareBigInt(a.market.marketID, b.market.marketID))
        .at(-1)?.market.symbolData.symbol,
    };
  }, [props, registryResource, allTimeVolumeData]);

  return (
    <div className="flex flex-col w-full">
      <KeyAndValue field="Number of markets" value={numMarkets} />
      <KeyAndValue field="Number of markets post-bonding curve" value={numPostBondingCurve} />
      <KeyAndValue field="Number of markets in bonding curve" value={numInBondingCurve} />
      <KeyAndValue field="Number of markets >= 100 APT mkt cap" value={numSignificantMarketCap} />
      <KeyAndValue field="Number of markets < 100 APT mkt cap" value={numLowMarketCap} />
      <br />
      <KeyAndValue field="Daily volume (rolling 24h)" value={data.cumulativeDailyVolume} apt />
      <KeyAndValue field="Number of markets active in last 24h" value={data.numRecentlyActive} />
      <KeyAndValue field="Number of markets traded in last 24h" value={data.numRecentlyTraded} />
      <br />
      <KeyAndValue field="Last state bump" value={data.lastBumpTime} />
      <KeyAndValue field="Last market registered" value={data.lastMarketRegistered} />
      <KeyAndValue field="Last market register time" value={data.lastMarketRegister} />
      <br />
      <KeyAndValue field="Cumulative quote volume" value={data.cumulativeQuoteVolume} apt />
      <KeyAndValue field="Total quote locked" value={data.totalQuoteLocked} apt />
      <KeyAndValue field="Total value locked" value={data.totalValueLocked} apt />
      <KeyAndValue field="Fully diluted value" value={data.fullyDilutedValue} apt />
      <KeyAndValue field="Cumulative integrator fees" value={data.cumulativeIntegratorFees} apt />
      <KeyAndValue field="Total market cap" value={data.marketCap} apt />
      <KeyAndValue field="Total number of interactions" value={data.globalNonce} />
      <br />
    </div>
  );
};
