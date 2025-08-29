import {
  DEFAULT_STATS_SORT_BY,
  MAX_MIDDLEWARE_PAGE_NUMBER,
  StatsSortSchema,
} from "app/stats/(utils)/schema";
import { OrderBySchema, PageSchema } from "lib/api/schemas/api-pagination";
import { NextResponse } from "next/server";
import { ROUTES } from "router/routes";
import { z } from "zod";

import { toOrderByString } from "@/sdk/indexer-v2/const";
import { DEFAULT_SORT_BY, SortMarketsBy } from "@/sdk/indexer-v2/types/common";

/**
 * This function returns a NextResponse if the path matches home or stats.
 * It returns undefined otherwise.
 */
export default function handleStatsOrHomePageParams(url: URL): NextResponse | undefined {
  const { pathname } = url;

  const isHome = pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`);
  const isStats = pathname === ROUTES.stats || pathname.startsWith(`${ROUTES.stats}/`);
  if (!isHome && !isStats) {
    return undefined;
  }

  // If they're the default no-slug pages, aka /home or /stats, the next.config.mjs redirects didn't
  // work properly. Throw in non-prod, log in development.
  if (pathname === ROUTES.home || pathname === ROUTES.stats) {
    const newPathname = isHome
      ? `${ROUTES.home}/${DEFAULT_SORT_BY}/1`
      : `${ROUTES.stats}/${DEFAULT_STATS_SORT_BY}/1/desc`;
    const newURL = new URL(newPathname, url);
    return NextResponse.rewrite(newURL);
  }

  const segments = pathname.split("/").filter(Boolean);
  const sort = segments.at(1);
  const page = segments.at(2);
  const order = segments.at(3);

  const parsedPage = PageSchema.refine(
    (v) => v <= MAX_MIDDLEWARE_PAGE_NUMBER,
    `Max middleware page number is: ${MAX_MIDDLEWARE_PAGE_NUMBER}, got ${page}`
  )
    // Ensure it's safe to consider this as *never* throwing an error and supplying a default value.
    .catch(1)
    .parse(page);

  if (isHome) {
    const parsedSort = z
      .enum([
        SortMarketsBy.BumpOrder,
        SortMarketsBy.AllTimeVolume,
        SortMarketsBy.DailyVolume,
        SortMarketsBy.MarketCap,
      ])
      .default(SortMarketsBy.BumpOrder)
      // Ensure it's safe to consider this as *never* throwing an error and supplying a default value.
      .catch(SortMarketsBy.BumpOrder)
      .parse(sort);

    const newPathname = `${ROUTES.home}/${parsedSort}/${parsedPage}`;
    if (newPathname !== pathname) {
      const newURL = new URL(newPathname, url);
      return NextResponse.redirect(newURL);
    } else {
      return NextResponse.next();
    }
  }

  // Stats page.
  const parsedSort = StatsSortSchema.catch(DEFAULT_STATS_SORT_BY).parse(sort);
  const parsedOrder = OrderBySchema.transform(toOrderByString).catch("desc").parse(order);

  const newPathname = `${ROUTES.stats}/${parsedSort}/${parsedPage}/${parsedOrder}`;
  if (newPathname !== pathname) {
    const newURL = new URL(newPathname, url);
    return NextResponse.redirect(newURL);
  }
  return NextResponse.next();
}
