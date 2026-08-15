'use client';

import { DEFAULT_JEWELLERY_CONFIG } from '@smartecommerce/shared/tenant-config';
import type { TenantConfig } from '@smartecommerce/shared/types';
import { createContext, useContext, useEffect, type ReactNode } from 'react';

const TenantConfigContext = createContext<TenantConfig>(DEFAULT_JEWELLERY_CONFIG);

export function useTenantConfig(): TenantConfig {
  return useContext(TenantConfigContext);
}

export function TenantConfigProvider({ children }: { children: ReactNode }) {
  const config = DEFAULT_JEWELLERY_CONFIG;

  useEffect(() => {
    // Inject CSS variables into document root
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--accent', config.accentColor);
    root.style.setProperty('--brand-font', config.fontFamily);
  }, [config]);

  return (
    <TenantConfigContext.Provider value={config}>
      {children}
    </TenantConfigContext.Provider>
  );
}
