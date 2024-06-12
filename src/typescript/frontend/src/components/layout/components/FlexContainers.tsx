import { type PropsWithChildren, type HTMLAttributes } from "react";

export const Column = (props: HTMLAttributes<HTMLDivElement> & PropsWithChildren) => (
  <div {...props} className={`flex flex-col ${props.className ?? ""}`}>
    {props.children}
  </div>
);

export const Row = (props: HTMLAttributes<HTMLDivElement> & PropsWithChildren) => (
  <div {...props} className={`flex flex-row ${props.className ?? ""}`}>
    {props.children}
  </div>
);
