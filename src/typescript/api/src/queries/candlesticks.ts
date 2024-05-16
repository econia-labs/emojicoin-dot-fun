import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL, LIMIT, ORDER_BY, TABLE_NAME } from ".";
import { Event, MarketRegistrationEvent, PeriodicStateEvent } from "../emojicoin_dot_fun/events";
import { AccountAddressInput, HexInput } from "@aptos-labs/ts-sdk";
import { CandlestickResolution } from "../emojicoin_dot_fun/consts";


export const getPeriodicStateEvents = ({
    after = new Date(),
}: {
    after: Date,
}) => {

}


    // const postgrest = new PostgrestClient(INBOX_URL);

    // // Wait to make sure events were processed and saved by Inbox.
    // await sleep(1000);
    // const res = await postgrest.from("inbox_events").select("type");
    // expect(res.data?.length).toBeGreaterThan(0);


export const getAllMarkets = async({
    inboxUrl = INBOX_URL,
    limit = LIMIT,
}: {
    inboxUrl?: string,
    limit?: number,
}) => {
    if (!inboxUrl) {
        throw new Error(`Invalid inboxUrl: ${inboxUrl}`);
    }
    const postgrest = new PostgrestClient(inboxUrl);

    const aggregated: Event[] = [];
    let go = true;
    while (go) {
        const offset = aggregated.length;
        const [count, data] = await postgrest.from(TABLE_NAME)
            .select("*")
            .filter("type", "eq", MarketRegistrationEvent.STRUCT_STRING)
            .order("transaction_version", ORDER_BY.DESC)
            .range(offset, offset + limit - 1)
            .then(res => [res.count ?? 0, res.data ?? []] as const);

        aggregated.push(...data.map(v => MarketRegistrationEvent.from(v)));
        go = count !== 0;
    }
    return aggregated;
}

/**
 * `postgrest` requires string values to be wrapped in double quotes
 * when filtering by inner jsonb columns.
 * @param val
 * @returns string
 *
 * @example
 * s(1) === "\"1\""
 * s(BigInt(1)) === "\"1\""
 * s("1") === "\"1\""
 * s("hello") === "\"hello\""
 */
const wrap = (val: number | bigint | string): string => {
    switch (typeof val) {
        case "number":
            return `"${val.toString()}"`;
        case "bigint":
            return `"${val.toString()}"`;
        case "string":
            return `"${val}"`;
        default:
            throw new Error(`Invalid value: ${val}`);
    }
}

export const getAllCandlesticks = async({
    marketID,
    resolution,
    inboxUrl = INBOX_URL,
    limit = LIMIT,
}: {
    marketID: number,
    resolution: CandlestickResolution,
    inboxUrl?: string,
    limit?: number,
}) => {
    if (!inboxUrl) {
        throw new Error(`Invalid inboxUrl: ${inboxUrl}`);
    }
    const postgrest = new PostgrestClient(inboxUrl);

    const aggregated: PeriodicStateEvent[] = [];
    let go = true;
    while (go) {
        const offset = aggregated.length;
        const [count, data] = await postgrest.from(TABLE_NAME)
            .select("*")
            .filter("type", "eq", PeriodicStateEvent.STRUCT_STRING)
            .eq("data->market_metadata->market_id", wrap(marketID))
            .eq("data->periodic_state_metadata->period", wrap(resolution))
            .order("transaction_version", ORDER_BY.DESC)
            .range(offset, offset + limit - 1)
            .then(res => [res.count ?? 0, res.data ?? []] as const);

        aggregated.push(...data.map(v => PeriodicStateEvent.from(v)));
        go = count !== 0;
    }

    // console.log(aggregated);
    return aggregated;
}

const main = async() => {
    const markets = await getAllMarkets({ });
    markets.forEach(m => {
        console.log(m);
    });
    const res = await getAllCandlesticks({
        marketID: 4,
        resolution: CandlestickResolution.PERIOD_1S,
    });

    res.forEach(r => {
        // console.log(r);
    });

    console.log(res.length)
}

main();
