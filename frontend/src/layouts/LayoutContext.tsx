import React, { createContext, useContext } from "react";

interface LayoutContextType {
  scrollViewportRef: React.RefObject<HTMLDivElement | null>;
  scrollToTop: (smooth?: boolean) => void;
  scroll: (option: ScrollToOptions) => void;
}

export const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout 必須在 RootLayout 內部使用");
  }
  return context;
};
