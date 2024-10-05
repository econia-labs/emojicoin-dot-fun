import { EMOJICOIN_INDEXER_URL } from "../../src/server-env";
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
});
