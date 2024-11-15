// cspell:word Kolkata
// cspell:word Fakaofo

import { type Bar } from "@static/charting_library/datafeed-api";

/**
 * Retrieves the client's timezone based on the current system time offset.
 *
 * @returns {Timezone} - The client's timezone as a string identifier (e.g., "America/New_York").
 */
export function getClientTimezone() {
  const timezones: { [key: string]: number } = {};
  timezones["America/New_York"] = -5;
  timezones["America/Los_Angeles"] = -8;
  timezones["America/Chicago"] = -6;
  timezones["America/Phoenix"] = -7;
  timezones["America/Toronto"] = -5;
  timezones["America/Vancouver"] = -8;
  timezones["America/Argentina/Buenos_Aires"] = -3;
  timezones["America/El_Salvador"] = -6;
  timezones["America/Sao_Paulo"] = -3;
  timezones["America/Bogota"] = -5;
  timezones["America/Caracas"] = -4;
  timezones["Europe/Moscow"] = 3;
  timezones["Europe/Athens"] = 2;
  timezones["Europe/Belgrade"] = 1;
  timezones["Europe/Berlin"] = 1;
  timezones["Europe/London"] = 0;
  timezones["Europe/Luxembourg"] = 1;
  timezones["Europe/Madrid"] = 1;
  timezones["Europe/Paris"] = 1;
  timezones["Europe/Rome"] = 1;
  timezones["Europe/Warsaw"] = 1;
  timezones["Europe/Istanbul"] = 3;
  timezones["Europe/Zurich"] = 1;
  timezones["Australia/Sydney"] = 10;
  timezones["Australia/Brisbane"] = 10;
  timezones["Australia/Adelaide"] = 9.5;
  timezones["Australia/ACT"] = 10;
  timezones["Asia/Almaty"] = 6;
  timezones["Asia/Ashkhabad"] = 5;
  timezones["Asia/Tokyo"] = 9;
  timezones["Asia/Taipei"] = 8;
  timezones["Asia/Singapore"] = 8;
  timezones["Asia/Shanghai"] = 8;
  timezones["Asia/Seoul"] = 9;
  timezones["Asia/Tehran"] = 3.5;
  timezones["Asia/Dubai"] = 4;
  timezones["Asia/Kolkata"] = 5.5;
  timezones["Asia/Hong_Kong"] = 8;
  timezones["Asia/Bangkok"] = 7;
  timezones["Asia/Chongqing"] = 8;
  timezones["Asia/Jerusalem"] = 2;
  timezones["Asia/Kuwait"] = 3;
  timezones["Asia/Muscat"] = 4;
  timezones["Asia/Qatar"] = 3;
  timezones["Asia/Riyadh"] = 3;
  timezones["Pacific/Auckland"] = 12;
  timezones["Pacific/Chatham"] = 12.75;
  timezones["Pacific/Fakaofo"] = 13;
  timezones["Pacific/Honolulu"] = -10;
  timezones["America/Mexico_City"] = -6;
  timezones["Africa/Cairo"] = 2;
  timezones["Africa/Johannesburg"] = 2;
  timezones["Asia/Kathmandu"] = 5.75;
  timezones["US/Mountain"] = -7;

  const timezone = (new Date().getTimezoneOffset() * -1) / 60;
  for (const key in timezones) {
    if (timezones[key] === timezone) {
      return key;
    }
  }
  return "Etc/UTC";
}

export const hasTradingActivity = (bar: Bar) =>
  [bar.open, bar.high, bar.low, bar.close].some((price) => price !== 0);
