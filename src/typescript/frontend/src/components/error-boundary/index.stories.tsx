import { ErrorBoundaryFallback as StyledErrorBoundaryFallback } from "components";

export default {
  title: "Components/ErrorBoundaryFallback",
};

export const ErrorBoundaryFallback: React.FC = () => {
  return <StyledErrorBoundaryFallback error={new Error("Error")} resetError={() => null} />;
};
