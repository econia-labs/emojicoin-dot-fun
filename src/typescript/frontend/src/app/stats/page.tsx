import type { StatsSchemaInput } from "app/stats/(utils)/schema";
import { notFound } from "next/navigation";

import DataWriter from "./(components)/DataWriter";
import { getStatsPageData } from "./(utils)/fetches";

export interface StatsPageParams {
  params: StatsSchemaInput;
}

export const revalidate = 30;
// Disabled because static pages for the stats page ultimately makes the UX worse, but the option is there.
// export const dynamic = "force-static";
// export const dynamicParams = true;

export default async function Stats() {
  const stats = await getStatsPageData({ params: {} });

  if ("notFound" in stats) {
    return notFound();
  }

  return <DataWriter key={`${stats.sort}/${stats.page}/${stats.order}`} {...stats} />;
}
