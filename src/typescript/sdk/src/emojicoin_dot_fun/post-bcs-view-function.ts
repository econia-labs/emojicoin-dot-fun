import {
  type MoveValue,
  type Aptos,
  type AptosConfig,
  type EntryFunction,
  type LedgerVersionArg,
  MimeType,
  postAptosFullNode,
  Serializer,
} from "@aptos-labs/ts-sdk";
import { toConfig } from "../utils";

export async function postBCSViewFunction<T extends Array<MoveValue>>(args: {
  aptosConfig: Aptos | AptosConfig;
  payload: EntryFunction;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { payload, options } = args;
  const aptosConfig = toConfig(args.aptosConfig);
  const serializer = new Serializer();
  payload.serialize(serializer);
  const bytes = serializer.toUint8Array();
  const { data } = await postAptosFullNode<Uint8Array, MoveValue[]>({
    aptosConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });
  return data as T;
}
