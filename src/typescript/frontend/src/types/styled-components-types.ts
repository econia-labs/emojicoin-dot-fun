import { ComponentProps, ElementType } from "react";
import { DefaultTheme } from "styled-components";

export interface ThemedProps {
  theme: DefaultTheme;
}

export type AsProps<E extends ElementType = ElementType> = {
  as?: E;
};

export type MergeProps<E extends ElementType> = AsProps<E> & Omit<ComponentProps<E>, keyof AsProps>;

export type PolymorphicComponentProps<E extends ElementType, P> = P & MergeProps<E>;
