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
  const data = props.params.data;
  const setCode = useUserSettings((s) => s.setCode);

  useEffect(() => {
    if (setCode) {
      setCode(data);
      redirect("/home");
    }
  }, [data, setCode]);

  return (
    <div className="h-[100%] w-[100%] grid items-center">
      <div className="text-center pixel-heading-2 text-white">Redeeming...</div>
    </div>
  );
}
