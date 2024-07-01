import * as DropdownMenuPrimitives from "@radix-ui/react-dropdown-menu";
import { type ElementRef, forwardRef } from "react";

const PrimitivePortal = DropdownMenuPrimitives.Portal;
const PrimitiveItem = DropdownMenuPrimitives.Item;
const PrimitiveContent = DropdownMenuPrimitives.Content;
const PrimitiveSeparator = DropdownMenuPrimitives.Separator;

const DropdownMenu = DropdownMenuPrimitives.Root;
const DropdownTrigger = DropdownMenuPrimitives.Trigger;
const DropdownGroup = DropdownMenuPrimitives.Group;
const DropdownPortal = DropdownMenuPrimitives.Portal;
const DropdownArrow = DropdownMenuPrimitives.Arrow;

const DropdownItem = forwardRef<
  ElementRef<typeof PrimitiveItem>,
  React.ComponentPropsWithoutRef<typeof PrimitiveItem>
>(({ className, ...props }, ref) => (
  <PrimitiveItem ref={ref} className={className + ""} {...props} />
));
DropdownItem.displayName = PrimitiveItem.displayName;

const DropdownContent = forwardRef<
  ElementRef<typeof PrimitiveContent>,
  React.ComponentPropsWithoutRef<typeof PrimitiveContent>
>(({ className, ...props }, ref) => (
  <PrimitivePortal>
    <PrimitiveContent ref={ref} className={className + ""} {...props} />
  </PrimitivePortal>
));
DropdownContent.displayName = PrimitiveContent.displayName;

const DropdownSeparator = forwardRef<
  ElementRef<typeof PrimitiveSeparator>,
  React.ComponentPropsWithoutRef<typeof PrimitiveSeparator>
>(({ className, ...props }, ref) => (
  <PrimitiveSeparator ref={ref} className={className + ""} {...props} />
));
DropdownSeparator.displayName = PrimitiveSeparator.displayName;

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownGroup,
  DropdownPortal,
  DropdownArrow,
  DropdownItem,
  DropdownContent,
  DropdownSeparator,
};
