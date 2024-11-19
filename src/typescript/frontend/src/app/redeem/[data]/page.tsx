"use client";

import { useUserSettings } from "context/event-store-context";
import { redirect } from "next/navigation";
import { useEffect } from "react";

interface PageProps {
  params: {
    data: string;
  };
  searchParams: {};
}

export default function GenerateQRCode(props: PageProps) {
  const claimKey = decodeURIComponent(props.params.data);
  const setClaimKey = useUserSettings((s) => s.setClaimKey);

  useEffect(() => {
    if (setClaimKey) {
      setClaimKey(claimKey);
      redirect("/home");
    }
  }, [claimKey, setClaimKey]);

  return (
    <div className="h-[100%] w-[100%] block content-center">
      <div className="text-center pixel-heading-2 text-ec-blue">Redeeming...</div>
    </div>
  );
}
