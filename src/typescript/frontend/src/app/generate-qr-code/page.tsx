"use client";

import Link from "next/link";
import { useState } from "react";
import "./module.css";

export default function GenerateQRCode() {
  const [claimKey, setClaimKey] = useState<string>("");

  return (
    <div className="h-[100%] w-[100%] grid items-center">
      <div className="m-auto flex flex-col gap-[16px]">
        <textarea
          autoFocus={true}
          rows={4}
          placeholder={"Claim key..."}
          value={claimKey}
          onChange={(v) => setClaimKey(v.currentTarget.value.replace(/\n/g, ""))}
          className="bg-black text-3xl outline-none text-ec-blue p-[10px]"
          style={{
            border: "3px dashed var(--ec-blue)",
          }}
        />
        <Link href={`/generate-qr-code/${encodeURIComponent(claimKey)}`}>
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
