import DataWriter from "app/stats/(components)/DataWriter";
import { getStatsPageData } from "app/stats/(utils)/fetches";
import { generateStatsPageStaticParams } from "app/stats/(utils)/static-params";
import type { StatsPageParams } from "app/stats/page";
import { notFound } from "next/navigation";

export const revalidate = 30;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  return await generateStatsPageStaticParams();
}

export default async function Stats({ params = {} }: StatsPageParams) {
  const stats = await getStatsPageData({ params });

  if ("notFound" in stats) {
    return notFound();
  }

  return <DataWriter key={`${stats.sort}/${stats.page}/${stats.order}`} {...stats} />;
}
