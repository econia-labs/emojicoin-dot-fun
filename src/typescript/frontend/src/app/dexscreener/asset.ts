/***
 Request: GET /asset?id=:string

 Response Schema:
 // interface AssetResponse {
 //  asset: Asset;
 // }

 Example Response:
 // {
 //   "asset": {
 //     "id": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
 //     "name": "Wrapped Ether",
 //     "symbol": "WETH",
 //     "totalSupply": 10000000,
 //     "circulatingSupply": 900000,
 //     "coinGeckoId": "ether",
 //     "coinMarketCapId": "ether"
 //   }
 // }
 **/

import { type NextRequest, NextResponse } from "next/server";
import { getAptosClient } from "@sdk/utils/aptos-client";

/**
 * - In most cases, asset ids will correspond to contract addresses. Ids are case-sensitive.
 * - All `Asset` props aside from `id` may be mutable. The Indexer will periodically query assets for their most
 * up-to-date info
 * - `totalSupply` is optional but DEX Screener cannot calculate FDV/Market Cap if not available
 * - `circulatingSupply` is optional but DEX Screener may not be able to show accurate market cap if not available
 * - `coinGeckoId` and `coinMarketCapId` are optional but may be used for displaying additional token information such
 * as image, description and self-reported/off-chain circulating supply
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 */
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply: number;
  coinGeckoId?: string;
  coinMarketCapId?: string;
  metadata?: Record<string, string>;
}

export interface AssetResponse {
  asset: Asset;
}

/**
 * Fetches an asset by a string of the emojis that represent the asset
 * @param assetId
 */
export function getAsset(assetId: string): Promise<Asset> {
  const aptos = getAptosClient();
}

// NextJS JSON response handler
export async function GET(request: NextRequest): Promise<NextResponse<AssetResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get("id");
  const asset = await getAsset(assetId);
  return NextResponse.json({ asset });
}