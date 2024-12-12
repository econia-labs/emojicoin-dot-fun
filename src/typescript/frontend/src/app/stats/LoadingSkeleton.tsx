"use client";

import AnimatedLoadingBoxes from "components/pages/launch-emojicoin/animated-loading-boxes";
import { Suspense, use } from "react";

// NOTE: The Suspense boundary won't work unless a separate client component awaits the promise. The `Suspense` wrapper
//   can't be used in the same component that settles the promise with `use(...)`
const Container = ({ promised }: { promised: Promise<JSX.Element> }) => {
  const awaited = use(promised);
  return <div>{awaited}</div>;
};

export const LoadingSkeleton = ({
  promised,
  numSquares = 4,
}: {
  promised: Promise<JSX.Element>;
  numSquares?: number;
}) => (
  <Suspense fallback={<AnimatedLoadingBoxes numSquares={numSquares} />}>
    <Container promised={promised} />
  </Suspense>
);
