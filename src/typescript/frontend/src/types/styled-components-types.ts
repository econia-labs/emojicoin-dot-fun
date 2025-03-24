import type { ComponentProps, ElementType } from "react";
import type { DefaultTheme } from "styled-components";

interface ThemedProps {
  theme: DefaultTheme;
}

type AsProps<E extends ElementType = ElementType> = {
  as?: E;
};

type MergeProps<E extends ElementType> = AsProps<E> & Omit<ComponentProps<E>, keyof AsProps>;

export type PolymorphicComponentProps<E extends ElementType, P> = P & MergeProps<E>;
