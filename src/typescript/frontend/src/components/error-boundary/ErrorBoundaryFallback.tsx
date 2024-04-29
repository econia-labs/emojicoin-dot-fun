import React from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "router/routes";

import "./styles.css";

import { ErrorBoundaryFallbackProps } from "./types";

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const onPressHandler = () => {
    resetError?.();
    navigate(ROUTES.root);
  };

  return (
    <div className="error-container">
      <h1 className="error-container__title">Something went wrong!</h1>

      {error && <p className="error-container__message">{error?.toString()}</p>}

      <h2 className="error-container__sub-title">Please, go to home page</h2>

      <button className="error-container__button" onClick={onPressHandler}>
        Go to home page
      </button>
    </div>
  );
};

export default ErrorBoundaryFallback;
