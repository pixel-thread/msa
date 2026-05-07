"use client";

import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

import { useTheme } from "~/shared/providers/theme-provider";

export const Toaster = ({ ...props }: ToasterProps) => {
  const { themeMode } = useTheme();

  return (
    <Sonner
      theme={themeMode === "auto" ? "system" : themeMode}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { toast };
