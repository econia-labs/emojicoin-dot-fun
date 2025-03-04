import { cn } from "lib/utils/class-name";
import { type HTMLMotionProps, motion } from "framer-motion";
import * as React from "react";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "text-ec-blue body-lg bg-black uppercase text-center sticky top-0 z-50 border-y border-dark-gray bg-clip-padding",
      "[&_td]:!border [&_td]:!border-dark-gray [&_td]:before:absolute [&_td]:before:top-0",
      "[&_td]:before:h-[1px] [&_td]:before:w-full [&_td]:before:bg-dark-gray",
      "before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-dark-gray before:z-50 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-dark-gray",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("table-body", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-8 align-middle tracking-wide font-forma [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "text-light-gray align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  HTMLMotionProps<"tr"> & { noHover?: boolean; isHeader?: boolean; index?: number; height?: number }
>(({ className, height = 33, noHover, isHeader = false, index = 0, ...props }, ref) => {
  // Shorter duration for rows further down, to avoid them taking forever to animate in.
  const delay = React.useMemo(() => {
    if (index <= 30) {
      return index * 0.025;
    }
    const first30 = 30 * 0.025;
    const after30 = (index % 30) * 0.01;
    return first30 + after30;
  }, [index]);

  return (
    <motion.tr
      layout
      initial={{
        filter: "brightness(1) saturate(1)",
        boxShadow: "0 0 0px 0px rgba(0, 0, 0, 0)",
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        transition: {
          type: "just",
          delay,
        },
      }}
      whileHover={
        !isHeader
          ? {
              filter: "brightness(1.05) saturate(1.1)",
              boxShadow: "0px 0px 4px 2px #086CD9",
              transition: { duration: 0.01 },
            }
          : {}
      }
      ref={ref}
      style={{ height, ...props.style }}
      className={cn(
        "relative w-full",
        !isHeader && !noHover
          ? "border-solid border-y border-dark-gray transition-colors border-2 hover:z-10"
          : "",
        className
      )}
      {...props}
    >
      {props.children as React.ReactNode}
    </motion.tr>
  );
});
TableRow.displayName = "TableRow";

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
