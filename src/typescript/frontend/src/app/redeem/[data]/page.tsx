"use client";

import { type FreeSwapData } from "@/store/user-settings-store";
import { useUserSettings } from "context/event-store-context";
import { redirect } from "next/navigation";
import { useEffect, useMemo } from "react";
import { parseJSON } from "utils";

interface PageProps {
  params: {
    data: string;
  };
  searchParams: {};
}

export default function GenerateQRCode(props: PageProps) {
  const data = decodeURIComponent(props.params.data);
  const setFreeSwap = useUserSettings((s) => s.setFreeSwapData);
  const freeSwapData: FreeSwapData = useMemo(() => {
    return parseJSON(atob(data));
  }, [data]);

  useEffect(() => {
    if (setFreeSwap) {
      setFreeSwap(freeSwapData);
      redirect("/home");
    }
  }, [freeSwapData, setFreeSwap]);

  return (
    <div className="h-[100%] w-[100%] block content-center">
      <div className="text-center pixel-heading-2 text-ec-blue">Redeeming...</div>
    </div>
  );
}
