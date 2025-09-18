import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  sideMenuOpen: boolean;
  setSideMenuOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);

  return (
    <UIContext.Provider
      value={{
        cartOpen,
        setCartOpen,
        sideMenuOpen,
        setSideMenuOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};