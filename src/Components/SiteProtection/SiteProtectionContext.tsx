import React, { createContext, useContext, useState } from "react";

const SITE_PASSWORD = "dajuvai@2026";
const SESSION_KEY = "dajuvai_site_access";

interface SiteProtectionContextType {
  isUnlocked: boolean;
  tryUnlock: (password: string) => boolean;
}

const SiteProtectionContext = createContext<SiteProtectionContextType>({
  isUnlocked: false,
  tryUnlock: () => false,
});

export const SiteProtectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );

  const tryUnlock = (password: string): boolean => {
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  return (
    <SiteProtectionContext.Provider value={{ isUnlocked, tryUnlock }}>
      {children}
    </SiteProtectionContext.Provider>
  );
};

export const useSiteProtection = () => useContext(SiteProtectionContext);
