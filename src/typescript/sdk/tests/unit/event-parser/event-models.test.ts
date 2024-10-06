// cspell:word
import path from "path";
import fs from "fs";
import { parseJSONWithBigInts } from "../../../src/indexer-v2/json-bigint";
import { toMarketStateModel } from "../../../src/indexer-v2/types";
import { type DatabaseJsonType } from "../../../src/indexer-v2/types/json-types";
import goldens from "./goldens";

// Note that we *cannot* import directly from the JSON file like below, because node.js will try to
// import and and thus (incorrectly) parse the JSON in the file. Plus it's also typed wrong. It's
// mostly there to provide a more readable example than the raw text string.
// import BondingCurveStatesJSON from "./json/bonding-curve-states.json";

// Instead, read the data directly from the file and parse it.
const statesJsonPath = path.join(__dirname, "json", "bonding-curve-states.json");
const jsonBuffer = fs.readFileSync(statesJsonPath);

// Note that they are arrays because that's how they appear in `postgrest` responses.
const data: {
  pre_bonding_curve: DatabaseJsonType["market_state"][];
  post_bonding_curve: DatabaseJsonType["market_state"][];
} = parseJSONWithBigInts(jsonBuffer.toString());

const TestData = {
  preBondingCurve: {
    json: data["pre_bonding_curve"],
    text: `[{"transaction_version":6084169932,"sender":"0xbad225596d685895aa64d92f4f0e14d2f9d8075d3b
    8adf1e90ae6037f1fcbabe","entry_function":"0x22227920701e36651a6649be2067cd7eebf3fabb94717ff3b256
    e3ada58b2222::emojicoin_dot_fun_rewards::swap_with_rewards","transaction_timestamp":"2024-10-04T
    09:29:38.69085","inserted_at":"2024-10-04T09:29:14.65541","market_id":65,"symbol_bytes":"\\\\xf0
    9f9889f09f9983","symbol_emojis":["😉","🙃"],"bump_time":"2024-10-04T09:29:38.69085","market_nonc
    e":2,"trigger":"swap_buy","market_address":"0xa8f7c8ced47426d7c3762d0b5a9840487cde820b7a5a4a4751
    ecaf32f790fa82","clamm_virtual_reserves_base":4887902441457393,"clamm_virtual_reserves_quote":40
    099000000,"cpamm_real_reserves_base":0,"cpamm_real_reserves_quote":0,"lp_coin_supply":0,"cumulat
    ive_stats_base_volume":12097558542607,"cumulative_stats_quote_volume":99000000,"cumulative_stats
    _integrator_fees":101000000,"cumulative_stats_pool_fees_base":0,"cumulative_stats_pool_fees_quot
    e":0,"cumulative_stats_n_swaps":1,"cumulative_stats_n_chat_messages":0,"instantaneous_stats_tota
    l_quote_locked":99000000,"instantaneous_stats_total_value_locked":36916510610,"instantaneous_sta
    ts_market_cap":99245024,"instantaneous_stats_fully_diluted_value":36916755635,"last_swap_is_sell
    ":false,"last_swap_avg_execution_price_q64":150958365430955,"last_swap_base_volume":120975585426
    07,"last_swap_quote_volume":99000000,"last_swap_nonce":2,"last_swap_time":"2024-10-04T09:29:38.6
    9085","daily_tvl_per_lp_coin_growth":0,"in_bonding_curve":true,"volume_in_1m_state_tracker":9900
    0000,"daily_volume":99000000}]
    `.replaceAll(/\s/g, ""),
  },
  postBondingCurve: {
    json: data["post_bonding_curve"],
    text: `[{"transaction_version":6080639845,"sender":"0xc9b6bbf05e807d8935676c95ef00d694365ba5ff15
    b31cea6fc057cf6f9b6aa7","entry_function":"0x11113ddc70ea051ffd8a7cde7b96818326aabf56fdfd47807f77
    00e2b46e1111::emojicoin_dot_fun::provide_liquidity","transaction_timestamp":"2024-10-03T15:55:32
    .080509","inserted_at":"2024-10-03T01:09:52.037678","market_id":1,"symbol_bytes":"\\\\xf09f92bbe
    29aa1","symbol_emojis":["💻","⚡"],"bump_time":"2024-10-03T15:55:32.080509","market_nonce":47668
    ,"trigger":"provide_liquidity","market_address":"0x43dcf02dcc0f3759d00486052585bf1694acf85c7e3e7
    c4b4770c5216d58eb67","clamm_virtual_reserves_base":0,"clamm_virtual_reserves_quote":0,"cpamm_rea
    l_reserves_base":505979066626452,"cpamm_real_reserves_quote":198521507000,"lp_coin_supply":10010
    084634945,"cumulative_stats_base_volume":3994530680729664,"cumulative_stats_quote_volume":198321
    507000,"cumulative_stats_integrator_fees":2003200000,"cumulative_stats_pool_fees_base":123942526
    4986,"cumulative_stats_pool_fees_quote":0,"cumulative_stats_n_swaps":47073,"cumulative_stats_n_c
    hat_messages":593,"instantaneous_stats_total_quote_locked":198521507000,"instantaneous_stats_tot
    al_value_locked":397043014000,"instantaneous_stats_market_cap":1567059008921,"instantaneous_stat
    s_fully_diluted_value":1765580515921,"last_swap_is_sell":false,"last_swap_avg_execution_price_q6
    4":7244903199401139,"last_swap_base_volume":756212034737,"last_swap_quote_volume":297000000,"las
    t_swap_nonce":47667,"last_swap_time":"2024-10-03T15:55:08.649388","daily_tvl_per_lp_coin_growth"
    :1.001499814363967876933091555675361179387333896289378370590041427871042284306953206420708127389
    545305,"in_bonding_curve":false,"volume_in_1m_state_tracker":297000000,"daily_volume":0}]
    `.replaceAll(/\s/g, ""),
  },
};

describe("tests for parsing event model data", () => {
  it("parses a market state model with a market pre bonding curve", () => {
    const { preBondingCurve: data } = TestData;
    const { json, text } = data;
    const parsedArray = parseJSONWithBigInts<DatabaseJsonType["market_state"][]>(text);
    const [parsed] = parsedArray;
    expect(parsedArray).toEqual(json);
    expect(parsed).toEqual(json[0]);
    const model = toMarketStateModel(parsed);
    const { preBondingCurve: goldenArray } = goldens.BondingCurveStates;
    const [golden] = goldenArray;
    for (const k of Object.keys(golden)) {
      const key = k as keyof typeof golden;
      expect(golden[key]).toEqual(model[key]);
    }
  });

  it("parses a market state model with a market post bonding curve", () => {
    const { postBondingCurve: data } = TestData;
    const { json, text } = data;
    const parsedArray = parseJSONWithBigInts<DatabaseJsonType["market_state"][]>(text);
    const [parsed] = parsedArray;
    expect(parsedArray).toEqual(json);
    expect(parsed).toEqual(json[0]);
    const model = toMarketStateModel(parsed);
    const { postBondingCurve: goldenArray } = goldens.BondingCurveStates;
    const [golden] = goldenArray;
    for (const k of Object.keys(golden)) {
      const key = k as keyof typeof golden;
      expect(golden[key]).toEqual(model[key]);
    }
  });
});
