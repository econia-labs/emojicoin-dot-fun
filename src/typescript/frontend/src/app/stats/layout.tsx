import { Suspense } from "react";

import StatsShell from "./(components)/StatsShell";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Suspense>
        <StatsShell>{children}</StatsShell>
      </Suspense>
    </>
  );
}
