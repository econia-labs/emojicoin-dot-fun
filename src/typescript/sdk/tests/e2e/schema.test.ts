// cspell:word nspname
// cspell:word proname
// cspell:word pronamespace

import { EMOJICOIN_INDEXER_URL } from "../../src/server/env";
import { type AnyColumnName, TableName } from "../../src/indexer-v2/types/json-types";
import {
  floatColumns,
  bigintColumns,
  integerColumns,
  PostgresNumericTypes,
} from "../../src/indexer-v2/types/postgres-numeric-types";

// This is not the full response type; it's just what we use in this test.
interface DatabaseSchema {
  definitions: {
    [Table in TableName]: {
      required: Array<string>;
      properties: {
        [Column in AnyColumnName]: {
          enum?: Array<string>;
          description?: string;
          format: string;
          maxLength?: number;
          type: string;
          items?: {
            type: string;
          };
        };
      };
    };
  };
}

// Note that these tests are *not* exhaustive. There is a more robust and comprehensive way to test
// that the types in the schema match our conversion types; however, it's not worth the effort since
// it's unlikely any significant more amount of types will be added.
// The most ideal way to do this would be to reflect on the schema with something like:
//
// SELECT
// n.nspname AS schema_name,
//  p.proname AS function_name,
//  pg_get_function_result(p.oid) AS result_type,
//  pg_get_function_arguments(p.oid) AS arguments
// FROM pg_proc p
// JOIN pg_namespace n ON p.pronamespace = n.oid
// WHERE p.proname = 'aggregate_market_state';
//
// and then using the values/types returned there to parse (and validate in schema e2e tests).
//
// For now, what's here is fine.

describe("verifies the schema is what's expected", () => {
  it("pulls the schema from `postgrest` and compares it against the types in the SDK", async () => {
    const response = await fetch(EMOJICOIN_INDEXER_URL);
    const json: DatabaseSchema = await response.json();
    const { definitions } = json;
    const tables = Object.values(TableName);
    const bigints: Set<AnyColumnName> = new Set();
    const floats: Set<AnyColumnName> = new Set();
    const integers: Set<AnyColumnName> = new Set();
    for (const table of tables) {
      type PropertyType = (typeof definitions)[typeof table]["properties"][AnyColumnName];
      const entries = Object.entries(definitions[table].properties) as [
        AnyColumnName,
        PropertyType,
      ][];
      const {
        floats: floatTypes,
        bigints: bigintTypes,
        integers: integerTypes,
      } = PostgresNumericTypes;
      for (const [field, property] of entries) {
        if (floatTypes.has(property.format)) floats.add(field);
        if (bigintTypes.has(property.format)) bigints.add(field);
        if (integerTypes.has(property.format)) integers.add(field);
      }
    }

    // Check if we have it in our set of bigint/numeric types. This is useful for ensuring that
    // we parse things correctly.
    expect(floats).toEqual(floatColumns);
    expect(bigints).toEqual(bigintColumns);
    expect(integers).toEqual(integerColumns);
  });

  it("ensures that the schema has been updated post migrations", async () => {
    // We know that the `daily_tvl_per_lp_coin_growth` column has `_64` at the end of it
    // before migrations are run. Check the schema and the column name and verify the schema cache
    // has been reloaded.
    const response = await fetch(EMOJICOIN_INDEXER_URL);
    const json: DatabaseSchema = await response.json();
    const { definitions } = json;
    const marketStateProperties = definitions["market_state"]["properties"];
    const marketStateColumnNames = new Set(Object.keys(marketStateProperties));
    expect(marketStateColumnNames.has("daily_tvl_per_lp_coin_growth")).toBe(true);
    expect(marketStateColumnNames.has("daily_tvl_per_lp_coin_growth_q64")).toBe(false);
  });

  it("ensures that there are no duplicate column names with different types in the SDK", () => {
    const mergedSetSize = new Set([...floatColumns, ...bigintColumns, ...integerColumns]).size;
    const sumOfIndividualSetSize =
      new Set(floatColumns).size + new Set(bigintColumns).size + new Set(integerColumns).size;
    expect(mergedSetSize).toEqual(sumOfIndividualSetSize);
  });
});
