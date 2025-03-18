// cspell:word localstorage

import {
  type ChartingLibraryWidgetOptions,
  type LanguageCode,
  type ResolutionString,
  type ThemeName,
} from "@static/charting_library";
import { ArenaPeriod, Period } from "@sdk/const";
import { GREEN as GREEN_HEX, PINK as PINK_HEX } from "theme/colors";
import { hexToRgba } from "utils/hex-to-rgba";
import { CDN_URL } from "lib/env";
import { type PeriodTypeFromBroker } from "@econia-labs/emojicoin-sdk";

export const TV_CHARTING_LIBRARY_RESOLUTIONS = [
  "15S",
  "1",
  "5",
  "15",
  "30",
  "60",
  "240",
  "1D",
] as ResolutionString[];

export const PINK = hexToRgba(PINK_HEX);
export const GREEN = hexToRgba(GREEN_HEX);
export const PINK_OPACITY_HALF = hexToRgba(`${PINK_HEX}80`);
export const GREEN_OPACITY_HALF = hexToRgba(`${GREEN_HEX}80`);

export const ResolutionStringToPeriod: { [key: string]: Period | ArenaPeriod } = {
  "15S": ArenaPeriod.Period15S,
  "1": Period.Period1M,
  "5": Period.Period5M,
  "15": Period.Period15M,
  "30": Period.Period30M,
  "60": Period.Period1H,
  "240": Period.Period4H,
  "1D": Period.Period1D,
};

export const ResolutionStringToBrokerPeriod: { [key: string]: PeriodTypeFromBroker } = {
  "15S": "FifteenSeconds",
  "1": "OneMinute",
  "5": "FiveMinutes",
  "15": "FifteenMinutes",
  "30": "ThirtyMinutes",
  "60": "OneHour",
  "240": "FourHours",
  "1D": "OneDay",
};

export const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;

export const EXCHANGE_NAME = "emojicoin.fun";

export const DEFAULT_RESOLUTION_STRING = "60" as ResolutionString;

export const WIDGET_OPTIONS: Omit<ChartingLibraryWidgetOptions, "datafeed" | "container"> = {
  library_path: `${CDN_URL}/charting_library/`,
  interval: DEFAULT_RESOLUTION_STRING,
  theme: "Dark" as ThemeName,
  locale: "en" as LanguageCode,
  custom_css_url: `${CDN_URL}/charting_library_stylesheets/emojicoin-dot-fun.css`,
  enabled_features: ["iframe_loading_compatibility_mode", "seconds_resolution"],
  disabled_features: [
    "use_localstorage_for_settings",
    "left_toolbar",
    "control_bar",
    "study_templates",
    "snapshot_trading_drawings",
  ],
  fullscreen: false,
  autosize: true,
  loading_screen: { backgroundColor: "#000000" },
  overrides: {
    "paneProperties.backgroundType": "solid",
    "paneProperties.background": "#000000",
    "scalesProperties.backgroundColor": "#000000",
    "mainSeriesProperties.barStyle.upColor": GREEN,
    "mainSeriesProperties.barStyle.downColor": PINK,
    "mainSeriesProperties.candleStyle.upColor": GREEN,
    "mainSeriesProperties.candleStyle.downColor": PINK,
    "mainSeriesProperties.candleStyle.borderUpColor": GREEN,
    "mainSeriesProperties.candleStyle.borderDownColor": PINK,
    "mainSeriesProperties.candleStyle.wickUpColor": GREEN,
    "mainSeriesProperties.candleStyle.wickDownColor": PINK,
    "mainSeriesProperties.columnStyle.upColor": GREEN_OPACITY_HALF,
    "mainSeriesProperties.columnStyle.downColor": PINK_OPACITY_HALF,
    "mainSeriesProperties.hollowCandleStyle.upColor": GREEN,
    "mainSeriesProperties.hollowCandleStyle.downColor": PINK,
    "mainSeriesProperties.rangeStyle.upColor": GREEN,
    "mainSeriesProperties.rangeStyle.downColor": PINK,
    "paneProperties.legendProperties.showVolume": true,
  },
  studies_overrides: {
    "volume.volume.color.0": PINK_HEX,
    "volume.volume.color.1": GREEN_HEX,
  },
  time_frames: [
    {
      text: "1D",
      resolution: "1" as ResolutionString,
    },
    {
      text: "5D",
      resolution: "5" as ResolutionString,
    },
    {
      text: "1M",
      resolution: "30" as ResolutionString,
    },
    {
      text: "3M",
      resolution: "60" as ResolutionString,
    },
    {
      text: "6M",
      resolution: "120" as ResolutionString,
    },
    {
      text: "1y",
      resolution: "D" as ResolutionString,
    },
    {
      text: "5y",
      resolution: "W" as ResolutionString,
    },
    {
      text: "1000y",
      resolution: "1" as ResolutionString,
      description: "All",
      title: "All",
    },
  ],
};
