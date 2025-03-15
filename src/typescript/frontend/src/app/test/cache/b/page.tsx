import { NextResponse } from "next/server";
import { fetchBlockHeight, fetchBlockHeightUnstableCache } from "../fetchData";

export const revalidate = 10;

export default async function PageB() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("");
  }
  const fetchRevalidate = await fetchBlockHeight();
  const unstableCache = await fetchBlockHeightUnstableCache();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <span className="pixel-display-2">Page B</span>
      <span className="pixel-display-2" id="unstable_cache">
        {unstableCache.block_height}
      </span>
      <span className="pixel-display-2" id="fetch_revalidate">
        {fetchRevalidate.block_height}
      </span>
    </div>
  );
}
