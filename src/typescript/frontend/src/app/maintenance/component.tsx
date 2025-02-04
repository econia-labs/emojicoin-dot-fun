"use client";

import { translationFunction } from "context/language-context";
import React from "react";
import { useScramble } from "use-scramble";
import { Text } from "components";
import MatrixRain from "./matrix";

export default function Maintenance() {
  const { t } = translationFunction();
  const { ref } = useScramble({ text: `{ ${t("Maintenance")} }` });
  return (
    <div className="relative">
      <MatrixRain />
      <Text
        ref={ref}
        textScale="pixelDisplay1"
        color="econiaBlue"
        textTransform="uppercase"
        className="fixed left-0 right-0 top-0 bottom-0 bg-black"
        style={{
          boxShadow: "0px 0px 30px 30px black",
          margin: "auto auto",
          width: "fit-content",
          height: "fit-content",
        }}
      />
    </div>
  );
}
