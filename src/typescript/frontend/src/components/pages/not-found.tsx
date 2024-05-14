"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "context";
import styled from "styled-components";
import { Page } from "components/layout/components/page";

export const StyledNotFoundPage = styled(Page)`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const NotFoundComponent: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const onClickHandler = () => {
    router.push("/");
  };

  return (
    <StyledNotFoundPage>
      <h1>{t("Not found Page")} 404</h1>

      <button onClick={onClickHandler}>{t("Go to home page")}</button>
    </StyledNotFoundPage>
  );
};

export default NotFoundComponent;
