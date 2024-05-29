import React, { type ErrorInfo } from "react";

import { type ErrorBoundaryProps, type ErrorBoundaryState } from "./types";

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: Readonly<ErrorBoundaryProps> | ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  resetError = () => {
    this.setState({ error: null });
  };

  render() {
    const { fallbackComponent: FallbackComponent } = this.props;
    const { error } = this.state;

    return error ? (
      <FallbackComponent error={error} resetError={this.resetError} />
    ) : (
      this.props.children
    );
  }
}

export default ErrorBoundary;
