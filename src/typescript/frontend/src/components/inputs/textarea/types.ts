import { ElementType } from "react";
import { PolymorphicComponentProps } from "types";
import { BaseInputProps } from "../input/types";

export interface BaseTextareaProps extends Omit<BaseInputProps, "scale"> {}

export type TextareaProps<P extends ElementType = "textarea"> = PolymorphicComponentProps<P, BaseTextareaProps>;
