"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { darkColors } from "theme";

interface PageProps {
  params: {
    qrcode: string;
  };
  searchParams: {};
}

const QRCODE_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  scale: 12,
  color: {
    light: darkColors.econiaBlue,
    dark: "#000000",
  },
};

const getUrl = (code: string) => `${location.protocol}//${location.host}/redeem/${code}`;

export default function GenerateQRCode(props: PageProps) {
  const data = props.params.qrcode;

  const [qrCode, setQrCode] = useState<string>();

  useEffect(() => {
    const url = getUrl(data);
    QRCode.toDataURL(url, QRCODE_OPTIONS).then(setQrCode);
  }, [data]);

  return (
    <div className="h-[100%] w-[100%] grid items-center">
      <div className="m-auto">
        <img alt="QR Code" className="m-auto w-[90vw] max-w-[40vh]" src={qrCode} />
      </div>
    </div>
  );
}
