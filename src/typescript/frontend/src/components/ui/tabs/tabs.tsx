// cspell:word scrollview
"use client";

import { Slottable } from "@radix-ui/react-slot";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "lib/utils/class-name";
import * as React from "react";

import SyncedScrollView from "@/components/synced-scrollview";

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <SyncedScrollView className="-mb-[1px]">
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "min-w-full border-b border-solid border-dark-gray inline-flex items-end space-x-2 px-2 pt-2 pb-0 relative",
        className
      )}
      {...props}
    />
  </SyncedScrollView>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    startSlot?: React.ReactNode;
    endSlot?: React.ReactNode;
  }
>(({ className, startSlot, endSlot, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex whitespace-nowrap items-center -mb-[1px] relative rounded-t-xl px-4 py-2 data-[state=active]:border border-dark-gray !text-[1.2rem] pixel-heading-3b uppercase transition-all",
      "text-light-gray data-[state=active]:border-b-0 data-[state=active]:text-white data-[state=active]:bg-darker-gray",
      "data-[state=active]:shadow-md data-[state=active]:z-20",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  >
    {startSlot && <div className="ml-2">{startSlot}</div>}
    <Slottable>{children}</Slottable>
    {endSlot && <div className="ml-2">{endSlot}</div>}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "bg-darker-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
