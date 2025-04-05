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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const paramsObject = Object.fromEntries(searchParams.entries());
  const {
    data: validatedParams,
    success,
    error,
  } = CandlesticksSearchParamsSchema.safeParse(paramsObject);

  if (!success) {
    return NextResponse.json(
      {
        error: "Invalid search params",
        details: error.flatten().fieldErrors,
      },
      {
        status: 400,
      }
    );
  }

  const queryHelper = new Parcel<CandlesticksDataType[number]>({
    parcelSize: 500,
    fetchHistoricThreshold: () => getLatestProcessedEmojicoinTimestamp().then((r) => r.getTime()),
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
    return new Response(stringifyJSON(data));
  } catch (e) {
    return new Response(e as string, { status: 400 });
  }
}
