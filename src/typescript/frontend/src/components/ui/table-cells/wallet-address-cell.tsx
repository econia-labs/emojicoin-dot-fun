import { useNameResolver } from "@hooks/use-name-resolver";
import { formatDisplayName } from "@sdk/utils";
import { cn } from "lib/utils/class-name";
import { useMemo } from "react";
import { ROUTES } from "router/routes";

export const WalletAddressCell = ({
  address,
  className,
}: {
  address: string;
  className?: string;
}) => {
  const resolvedName = useNameResolver(address);

  const { displayName, isANSName } = useMemo(() => {
    return {
      displayName: formatDisplayName(resolvedName),
      isANSName: address !== resolvedName,
    };
  }, [address, resolvedName]);

  return (
    <a
      href={`${ROUTES.wallet}/${address}`}
      className={cn("flex h-full", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={cn(
          isANSName ? "brightness-[1.4] contrast-[1.4]" : "",
          "text-light-gray hover:text-blue hover:underline"
        )}
      >
        {displayName}
      </span>
    </a>
  );
};
