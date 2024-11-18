"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./module.css";
import { stringifyJSON } from "utils";
import { type FreeSwapData } from "@/store/user-settings-store";

export default function GenerateQRCode() {
  const [feePayerKey, setFeePayerKey] = useState<string>("");
  const [claimCode, setClaimCode] = useState<string>("");

  const data = useMemo(() => {
    const pathData: FreeSwapData = { claimCode, feePayerKey };
    return btoa(stringifyJSON(pathData));
  }, [feePayerKey, claimCode]);

  return (
    <div className="h-[100%] w-[100%] grid items-center">
      <div className="m-auto flex flex-col gap-[16px]">
        <textarea
          autoFocus={true}
          rows={4}
          placeholder={"Fee payer key..."}
          value={feePayerKey}
          onChange={(v) => setFeePayerKey(v.currentTarget.value.replace(/\n/g, ""))}
          className="bg-black text-3xl outline-none text-ec-blue p-[10px]"
          style={{
            border: "3px dashed var(--ec-blue)",
          }}
        />
        <textarea
          autoFocus={true}
          rows={4}
          placeholder={"Claim code..."}
          value={claimCode}
          onChange={(v) => setClaimCode(v.currentTarget.value.replace(/\n/g, ""))}
          className="bg-black text-3xl outline-none text-ec-blue p-[10px]"
          style={{
            border: "3px dashed var(--ec-blue)",
          }}
        />
        <Link href={`/generate-qr-code/${encodeURIComponent(data)}`}>
          <button
            type="submit"
            className="text-ec-blue text-3xl uppercase w-[100%] p-[4px]"
            style={{
              border: "3px dashed var(--ec-blue)",
            }}
          >
            generate
          </button>
        </Link>
      </div>
    </div>
  );
}
