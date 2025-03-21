import {
  type Aptos,
  type AptosConfig,
  type EntryFunction,
  type LedgerVersionArg,
  MimeType,
  type MoveValue,
  postAptosFullNode,
  Serializer,
} from "@aptos-labs/ts-sdk";

import { toConfig } from "../utils/aptos-utils";

export async function postBCSViewFunction<
  T extends MoveValue[],
  Headers extends Record<string, unknown> = Record<string, never>,
>(args: { aptosConfig: Aptos | AptosConfig; payload: EntryFunction; options?: LedgerVersionArg }) {
  const { payload, options } = args;
  const aptosConfig = toConfig(args.aptosConfig);
  const serializer = new Serializer();
  payload.serialize(serializer);
  const bytes = serializer.toUint8Array();
  const { data, headers } = await postAptosFullNode<Uint8Array, T>({
    aptosConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });
  return {
    data: data as T,
    headers: headers as Headers,
  };
}
