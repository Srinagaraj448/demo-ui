import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  ChevronDown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { useToast } from '@/hooks/use-toast';

const EnvironmentSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentEnvironment, environments, setEnvironment, getCurrentUrl } = useEnvironment();
  const { toast } = useToast();

  const handleEnvironmentChange = (environment: string) => {
    setEnvironment(environment);
    setIsOpen(false);
    
    toast({
      title: "Environment Changed",
      description: `Switched to ${environments[environment as keyof typeof environments].name}`,
    });
  };

  const getEnvironmentIcon = (envKey: string) => {
    switch (envKey) {
      case 'PRODUCTION':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'UAT':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'QA':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEnvironmentBadgeVariant = (envKey: string) => {
    switch (envKey) {
      case 'PRODUCTION':
        return 'default';
      case 'UAT':
        return 'secondary';
      case 'QA':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const currentEnv = environments[currentEnvironment as keyof typeof environments];

  return (
    <div className="relative">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Environment
                </CardTitle>
                <p className="text-sm text-gray-500">Select your SimplifyQA environment</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="hover:bg-gray-100"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Environment Display */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              {getEnvironmentIcon(currentEnvironment)}
              <div>
                <p className="font-medium text-gray-800">{currentEnv.name}</p>
                <p className="text-sm text-gray-600">{currentEnv.description}</p>
              </div>
            </div>
            <Badge variant={getEnvironmentBadgeVariant(currentEnvironment)}>
              {currentEnvironment}
            </Badge>
          </div>

          {/* Current URL */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-mono text-gray-700 break-all">
              {getCurrentUrl()}
            </span>
          </div>

          {/* Environment Options */}
          {isOpen && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              {Object.entries(environments).map(([key, env]) => (
                <Button
                  key={key}
                  variant={currentEnvironment === key ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 p-3 h-auto ${
                    currentEnvironment === key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleEnvironmentChange(key)}
                >
                  {getEnvironmentIcon(key)}
                  <div className="text-left">
                    <p className="font-medium">{env.name}</p>
                    <p className="text-xs opacity-80">{env.description}</p>
                  </div>
                  {currentEnvironment === key && (
                    <CheckCircle className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Environment Status */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => window.open(getCurrentUrl(), '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Visit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentSelector; 