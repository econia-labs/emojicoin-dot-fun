import {
  type AnyNumberString,
  ArenaPeriod,
  Period,
  PeriodDuration,
  periodEnumToRawDuration,
} from "@econia-labs/emojicoin-sdk";
import { PARCEL_SIZE } from "app/api/candlesticks/utils";
import Big from "big.js";

const arenaPeriodEnumToRawDuration = (period: ArenaPeriod | Period) => {
  if (period === ArenaPeriod.Period15S) {
    return periodEnumToRawDuration(Period.Period1M) / 4;
  }
  return periodEnumToRawDuration(period as Period);
};

const indexParcelDate = (index: number, period: ArenaPeriod) => {
  const startMicroseconds = PARCEL_SIZE * (index * arenaPeriodEnumToRawDuration(period));
  const startMilliseconds = startMicroseconds / 1000;
  return new Date(startMilliseconds);
};

const getPeriodDurationSeconds = (period: ArenaPeriod) =>
  (arenaPeriodEnumToRawDuration(period) / PeriodDuration.PERIOD_1M) * 60;

const toIndex = (end: number, period: ArenaPeriod) => {
  const periodDuration = getPeriodDurationSeconds(period);
  const parcelDuration = periodDuration * PARCEL_SIZE;
  const index = Math.floor(end / parcelDuration);
  return index;
};

const getArenaPeriodStartTimeFromTime = (microseconds: AnyNumberString, period: ArenaPeriod) => {
  const periodDuration = arenaPeriodEnumToRawDuration(period);
  const time = BigInt(microseconds);
  // prettier-ignore
  const res = Big(time.toString())
    .div(periodDuration)
    .round(0, Big.roundDown)
    .mul(periodDuration);
  return BigInt(res.toString());
};

export const ArenaCandlesticksUtils = {
  indexToParcelStartDate: (idx: number, period: ArenaPeriod) => indexParcelDate(idx, period),
  indexToParcelEndDate: (idx: number, period: ArenaPeriod) => indexParcelDate(idx + 1, period),
  getPeriodDurationSeconds,
  toIndex,
  getArenaPeriodStartTimeFromTime,
};
