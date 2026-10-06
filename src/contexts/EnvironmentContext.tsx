import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SIMPLIFYQA_ENVIRONMENTS, DEFAULT_ENVIRONMENT } from '@/config/environment';

interface EnvironmentContextType {
  currentEnvironment: string;
  environments: typeof SIMPLIFYQA_ENVIRONMENTS;
  setEnvironment: (environment: string) => void;
  getCurrentUrl: () => string;
  refreshApiConfig: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

interface EnvironmentProviderProps {
  children: ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<string>(DEFAULT_ENVIRONMENT);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load saved environment from localStorage
    const savedEnvironment = localStorage.getItem('simplifyqa_environment');
    if (savedEnvironment && SIMPLIFYQA_ENVIRONMENTS[savedEnvironment as keyof typeof SIMPLIFYQA_ENVIRONMENTS]) {
      setCurrentEnvironment(savedEnvironment);
    }
  }, []);

  const setEnvironment = (environment: string) => {
    if (SIMPLIFYQA_ENVIRONMENTS[environment as keyof typeof SIMPLIFYQA_ENVIRONMENTS]) {
      setCurrentEnvironment(environment);
      localStorage.setItem('simplifyqa_environment', environment);
      // Trigger refresh of API config
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getCurrentUrl = (): string => {
    return SIMPLIFYQA_ENVIRONMENTS[currentEnvironment as keyof typeof SIMPLIFYQA_ENVIRONMENTS]?.url || SIMPLIFYQA_ENVIRONMENTS.QA.url;
  };

  const refreshApiConfig = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const value: EnvironmentContextType = {
    currentEnvironment,
    environments: SIMPLIFYQA_ENVIRONMENTS,
    setEnvironment,
    getCurrentUrl,
    refreshApiConfig,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}; 