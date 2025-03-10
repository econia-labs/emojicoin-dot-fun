import { PositiveBigIntSchema, toPositiveBigInt } from "@sdk/utils";
import { z } from "zod";

export const ArenaCandlesticksSearchParams = z.object({
    meleeID: PositiveBigIntSchema.default()
})