import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { Parcel } from "lib/parcel";
import { type NextRequest, NextResponse } from "next/server";
import { stringifyJSON } from "utils";

import { fetchPeriodicEventsTo, tryFetchMarketRegistration } from "@/queries/market";
import { type Period, PeriodDuration, periodEnumToRawDuration } from "@/sdk/index";
import { getLatestProcessedEmojicoinTimestamp } from "@/sdk/indexer-v2/queries/utils";

import { CandlesticksSearchParamsSchema } from "./search-params-schema";

type CandlesticksDataType = Awaited<ReturnType<typeof fetchPeriodicEventsTo>>;

const getCandlesticksParcel = async (
  { to, count }: { to: number; count: number },
  query: { marketID: number; period: Period }
) => {
  const endDate = new Date(to * 1000);

  const data = await fetchPeriodicEventsTo({
    ...query,
    end: endDate,
    amount: count,
  });

  return data;
};

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const paramsObject = Object.fromEntries(searchParams.entries());
  const validatedParams = CandlesticksSearchParamsSchema.parse(paramsObject);

  const queryHelper = new Parcel<CandlesticksDataType[number]>({
    parcelSize: 500,
    fetchHistoricThreshold: () =>
      getLatestProcessedEmojicoinTimestamp().then((r) => Math.floor(r.getTime() / 1000)),
    fetchFirst: () => tryFetchMarketRegistration(validatedParams.marketID),
    cacheKey: "candlesticks",
    getKey: (s) => Number(s.periodicMetadata.startTime / 1000n / 1000n),
    fetchFn: (params) =>
      getCandlesticksParcel(params, {
        marketID: validatedParams.marketID,
        period: validatedParams.period,
      }),
    step: (periodEnumToRawDuration(validatedParams.period) / PeriodDuration.PERIOD_1M) * 60,
  });

  try {
    const data = await queryHelper.getData(validatedParams.to, validatedParams.countBack);
    return new NextResponse(stringifyJSON(data), {
      headers: { "Content-type": "application/json" },
    });
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
