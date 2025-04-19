import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type ElementRef, forwardRef } from "react";

const PrimitiveItem = ToggleGroupPrimitive.Item;

const ToggleGroup = ToggleGroupPrimitive.Root;

const ToggleGroupItem = forwardRef<
  ElementRef<typeof PrimitiveItem>,
  React.ComponentPropsWithoutRef<typeof PrimitiveItem>
>(({ className = "", ...props }, ref) => (
  <PrimitiveItem ref={ref} className={className} {...props} />
));
ToggleGroupItem.displayName = PrimitiveItem.displayName;

export { ToggleGroup, ToggleGroupItem };
