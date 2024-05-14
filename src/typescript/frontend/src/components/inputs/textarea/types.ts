import { type ElementType } from "react";
import { type PolymorphicComponentProps } from "types";
import { type BaseInputProps } from "../input/types";

export interface BaseTextareaProps extends Omit<BaseInputProps, "scale"> {}

export type TextareaProps<P extends ElementType = "textarea"> = PolymorphicComponentProps<P, BaseTextareaProps>;
