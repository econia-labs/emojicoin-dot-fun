"use client";
import { useRouter } from "next/navigation";

import "./styles.css";

import { type ErrorBoundaryFallbackProps } from "./types";
import styled from "styled-components";
import { pixelar } from "styles/fonts";

export const ErrorContainerButton = styled.button`
  font-family: var(--font-pixelar) !important;
  border-radius: 8px;
  font-weight: 900;
  position: relative;
  -webkit-box-align: center;
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  -webkit-box-pack: center;
  justify-content: center;
  outline: 0px;
  transition: all 0.3s ease 0s;
  width: fit-content;
  padding: 9px 24px;
  min-width: 100px;
  font-size: 16px;
  line-height: 22px;
  background-color: rgb(107, 130, 224);
  border: 1px solid rgb(107, 130, 224);
  color: rgb(255, 255, 255);
  margin-top: 12px;
  margin-bottom: 12px;
`;

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => {
  const router = useRouter();

  const onPressHandler = () => {
    resetError?.();
    router.push("/");
  };

  return (
    <div className="error-container">
      <h1 className="error-container__title">Something went wrong!</h1>

      {error && <p className="error-container__message">{error?.toString()}</p>}

      <h2 className="error-container__sub-title">Please, go to home page</h2>

      <ErrorContainerButton className={pixelar.variable} onClick={onPressHandler}>
        Go to home page
      </ErrorContainerButton>
    </div>
  );
};

export default ErrorBoundaryFallback;
