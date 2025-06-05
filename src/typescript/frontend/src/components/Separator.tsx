import { cn } from "lib/utils/class-name";

export const Separator = ({ className }: { className?: string }) => (
  <div className={cn("-mx-[50%] w-[200vw] border-t border-solid border-dark-gray", className)} />
);
