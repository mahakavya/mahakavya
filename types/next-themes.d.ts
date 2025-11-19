// Minimal ambient declaration for `next-themes` to satisfy TypeScript until the package/types are present.

declare module "next-themes" {
  import type { ReactNode } from "react";

  export type Theme = string | "system" | "light" | "dark";

  export interface ThemeProviderProps {
    children?: ReactNode;
    attribute?: string;
    defaultTheme?: Theme;
    value?: { light: string; dark: string } | string;
    enableSystem?: boolean;
    storageKey?: string;
    forcedTheme?: string | null;
  }

  export const ThemeProvider: (props: ThemeProviderProps) => JSX.Element;
  export default ThemeProvider;
}
