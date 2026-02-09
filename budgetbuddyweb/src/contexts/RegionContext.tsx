import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getRegionConfig } from '../lib/regionConfig';
import type { Region, RegionConfig } from '../lib/regionConfig';

interface RegionContextType {
  region: Region;
  regionConfig: RegionConfig;
  setRegion: (region: Region) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export { RegionContext };

interface RegionProviderProps {
  children: ReactNode;
}

export const RegionProvider = ({ children }: RegionProviderProps) => {
  const [region, setRegionState] = useState<Region>(() => {
    const saved = localStorage.getItem('budgetbuddy_region');
    return (saved as Region) || 'GB';
  });

  const regionConfig = getRegionConfig(region);

  const setRegion = (newRegion: Region) => {
    setRegionState(newRegion);
    localStorage.setItem('budgetbuddy_region', newRegion);
  };

  useEffect(() => {
    // Set HTML lang attribute
    document.documentElement.lang = regionConfig.locale;
  }, [regionConfig]);

  return (
    <RegionContext.Provider value={{ region, regionConfig, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};
