# DEX Screener Adapter Specs

<b>Taken from https://dexscreener.notion.site/DEX-Screener-Adapter-Specs-cc1223cdf6e74a7799599106b65dcd0e </b>

v1.1 / Dec 2023

The DEX Screener Adapter is a set of HTTP endpoints that allows DEX Screener to track historical and real-time data for any Partner Decentralized Exchange. Adapters are responsible for supplying accurate and up-to-date data, whereas DEX Screener handles all data ingestion, processing and serving.

## Overview

- The DEX Screener Indexer queries Adapter endpoints to continuously index events as they become available, in chunks of one or many blocks at a time. Each block is only queried once, so caution must be taken to ensure that all returned data is accurate at the time of indexing.
- Adapters are to be deployed, served and maintained by the Partner
- If adapter endpoints become unreachable indexing will halt and automatically resume once they become available again
- The Indexer allows for customizable rate limits and block chunk size to ensure Adapter endpoints are not overloaded

## Endpoints

- An in-depth explanation of the schemas expected for each endpoint is described on the `Schemas` section below
- Numbers for amounts and price can be both `number` and `string`. Strings are more suitable when dealing with extremely small or extremely large numbers that can't be accurately serialized into JSON numbers.

- Indexing will halt if schemas are invalid or contain unexpected values (i.e.: `swapEvent.priceNative=0` or `pair.name=""`)
