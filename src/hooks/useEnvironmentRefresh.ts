import { useEffect, useRef } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export const useEnvironmentRefresh = () => {
  const { currentEnvironment } = useEnvironment();
  const prevEnvironment = useRef(currentEnvironment);

  useEffect(() => {
    if (prevEnvironment.current !== currentEnvironment) {
      // Environment has changed, trigger any necessary refreshes
      prevEnvironment.current = currentEnvironment;
      
      // You can add additional logic here for environment-specific refreshes
      console.log(`Environment changed to: ${currentEnvironment}`);
    }
  }, [currentEnvironment]);

  return { currentEnvironment };
}; 