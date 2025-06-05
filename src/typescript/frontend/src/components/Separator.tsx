import { cn } from "lib/utils/class-name";

export const Separator = ({ className }: { className?: string }) => (
  <div className={cn("w-[200vw] border-t border-solid border-dark-gray -mx-[50%]", className)} />
);
