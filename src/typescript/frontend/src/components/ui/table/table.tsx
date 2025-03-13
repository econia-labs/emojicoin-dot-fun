import { cn } from "lib/utils/class-name";
import { type HTMLMotionProps, motion } from "framer-motion";
import * as React from "react";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-separate bg-black", className)}
      {...props}
    />
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
      "text-ec-blue body-lg bg-black uppercase text-center sticky top-0 z-10",

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
  <tbody
    ref={ref}
    className={cn(
      "table-body [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-b-dark-gray [&>tr:hover+tr>td]:border-t-ec-blue",
      className
    )}
    {...props}
  />
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
      "h-8 align-middle tracking-wide font-forma [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-y border-solid border-dark-gray",
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
      "text-light-gray align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-solid border-t border-dark-gray group-hover:border-ec-blue first:border-l last:border-r first:border-l-black last:border-r-black",
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
  HTMLMotionProps<"tr"> & {
    animateInsertion?: boolean;
    noHover?: boolean;
    isHeader?: boolean;
    index?: number;
    height?: number;
  }
>(
  (
    { animateInsertion, className, height = 33, noHover, isHeader = false, index = 0, ...props },
    ref
  ) => {
    // Shorter duration for rows further down, to avoid them taking forever to animate in.
    const delay = React.useMemo(() => {
      // Start with minimal delay and increase logarithmically
      const baseDelay = 0.08;
      const maxDelay = 0.5;
      return Math.min(baseDelay + Math.log10(index + 1) * 0.08, maxDelay);
    }, [index]);

    return (
      <motion.tr
        initial={{
          filter: "brightness(1) saturate(1)",
          boxShadow: "0 0 0px 0px rgba(0, 0, 0, 0)",
          y: animateInsertion ? "-100%" : undefined,
          opacity: 0,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            opacity: {
              type: "just",
              delay,
            },
            y: { type: "just", delay: 0.05 },
          },
        }}
        whileHover={
          !isHeader
            ? {
                filter: "brightness(1.05) saturate(1.1)",
                boxShadow: "0 0 9px 7px rgba(8, 108, 217, 0.2)",
                transition: {
                  filter: { duration: 0.05 },
                  boxShadow: { duration: 0.05 },
                },
              }
            : {}
        }
        ref={ref}
        style={{ height, ...props.style }}
        className={cn(
          "relative w-full",
          !isHeader && !noHover ? "transition-colors border-2 hover:z-2 group" : "",
          className
        )}
        {...props}
      >
        {props.children as React.ReactNode}
      </motion.tr>
    );
  }
);
TableRow.displayName = "TableRow";

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
