"use client";

import { Text } from "components";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { useRouter } from "next/navigation";
import React from "react";

import { Page } from "../layout/components/page";

const NotFoundComponent: React.FC = () => {
  const { t } = translationFunction();
  const router = useRouter();

  const onClickHandler = () => {
    router.push("/");
  };

  return (
    <Page className="flex min-h-[100dvh] flex-col items-center justify-center px-4 md:px-6 mx-auto max-w-max">
      <Text textScale="pixelDisplay1" textTransform="uppercase">
        {t("Not found Page")} 404
      </Text>

      <Button onClick={onClickHandler} scale="lg">
        {t("Go to home page")}
      </Button>
    </Page>
  );
};

export default NotFoundComponent;
