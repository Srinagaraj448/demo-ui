# Environment Management System - Regal Manage

## Overview
This document describes the new environment management system implemented for the Regal Manage application. The system allows users to dynamically switch between different SimplifyQA environments (QA, UAT, and Production) and automatically updates the API base URL accordingly.

## 🌍 **Environment URLs**

The system supports three SimplifyQA environments:

| Environment | URL | Description | Default |
|-------------|-----|-------------|---------|
| **QA** | `https://qa.simplifyqa.com` | Quality Assurance testing environment | ❌ |
| **UAT** | `https://uat.simplifyqa.com` | User Acceptance Testing environment | ❌ |
| **Production** | `https://app.simplifyqa.com` | Live production environment | ✅ |

## ✨ **Key Features**

### **Dynamic Environment Switching**
- **Real-time URL Updates**: Base URL changes immediately when environment is selected
- **Persistent Selection**: Environment choice is saved in localStorage
- **Visual Feedback**: Clear indication of current environment with status badges
- **Professional UI**: Modern, intuitive interface for environment management

### **Automatic API Configuration**
- **Dynamic Base URLs**: API service automatically uses selected environment
- **Seamless Integration**: No code changes needed when switching environments
- **Data Consistency**: All API calls use the currently selected environment
- **Session Persistence**: Environment selection persists across browser sessions

### **Enhanced Dashboard**
- **Environment Selector**: Prominent placement in dashboard for easy access
- **Status Monitoring**: Real-time display of current environment status
- **Quick Actions**: Streamlined access to common tasks
- **Responsive Design**: Optimized for all device sizes

## 🏗️ **Architecture**

### **Components Structure**
```
src/
├── contexts/
│   └── EnvironmentContext.tsx      # Environment state management
├── components/
│   └── EnvironmentSelector.tsx     # Environment selection UI
├── hooks/
│   └── useEnvironmentRefresh.ts    # Environment change detection
└── config/
    └── environment.ts              # Environment configuration
```

### **Data Flow**
1. **User Selection**: User selects environment from dashboard
2. **State Update**: Environment context updates current selection
3. **Storage Persistence**: Selection saved to localStorage
4. **API Update**: API service automatically uses new base URL
5. **UI Refresh**: Dashboard displays updated environment information

## 🚀 **Usage**

### **Basic Environment Management**
```tsx
import { useEnvironment } from '@/contexts/EnvironmentContext';

const MyComponent = () => {
  const { 
    currentEnvironment, 
    environments, 
    setEnvironment, 
    getCurrentUrl 
  } = useEnvironment();
  
  // Get current environment info
  const currentEnv = environments[currentEnvironment];
  
  // Change environment
  const handleEnvironmentChange = (env: string) => {
    setEnvironment(env);
  };
  
  // Get current base URL
  const baseUrl = getCurrentUrl();
};
```

### **Environment Selector Component**
```tsx
import EnvironmentSelector from '@/components/EnvironmentSelector';

// In your dashboard
<div className="dashboard">
  <EnvironmentSelector />
  {/* Other dashboard content */}
</div>
```

### **API Service Integration**
```tsx
// The API service automatically uses the current environment
import { apiService } from '@/services/apiService';

// This will use the currently selected environment's base URL
const response = await apiService.searchCustomers(searchParams);
```

## 🎨 **User Interface**

### **Environment Selector Design**
- **Collapsible Interface**: Clean, space-efficient design
- **Visual Indicators**: Color-coded badges for different environments
- **Status Display**: Real-time environment information
- **Quick Actions**: Direct links to environment URLs

### **Dashboard Integration**
- **Prominent Placement**: Easy access from main dashboard
- **Status Cards**: Visual representation of environment status
- **Responsive Layout**: Adapts to different screen sizes
- **Professional Styling**: Consistent with overall design system

## ⚙️ **Configuration**

### **Environment Settings**
```typescript
// src/config/environment.ts
export const SIMPLIFYQA_ENVIRONMENTS = {
  QA: {
    name: 'QA Environment',
    url: 'https://qa.simplifyqa.com',
    description: 'Quality Assurance testing environment'
  },
  UAT: {
    name: 'UAT Environment',
    url: 'https://uat.simplifyqa.com',
    description: 'User Acceptance Testing environment'
  },
  PRODUCTION: {
    name: 'Production Environment',
    url: 'https://app.simplifyqa.ai',
    description: 'Live production environment'
  }
};
```

### **Default Environment**
```typescript
export const DEFAULT_ENVIRONMENT = 'PRODUCTION';
```

### **Custom Environment Addition**
To add a new environment:

1. **Update Configuration**:
```typescript
export const SIMPLIFYQA_ENVIRONMENTS = {
  // ... existing environments
  STAGING: {
    name: 'Staging Environment',
    url: 'https://staging.simplifyqa.com',
    description: 'Pre-production staging environment'
  }
};
```

2. **Update Default** (if needed):
```typescript
export const DEFAULT_ENVIRONMENT = 'STAGING';
```

## 🔄 **State Management**

### **Environment Context**
```typescript
interface EnvironmentContextType {
  currentEnvironment: string;
  environments: typeof SIMPLIFYQA_ENVIRONMENTS;
  setEnvironment: (environment: string) => void;
  getCurrentUrl: () => string;
  refreshApiConfig: () => void;
}
```

### **State Persistence**
- **localStorage Key**: `simplifyqa_environment`
- **Automatic Loading**: Environment restored on app initialization
- **Fallback Handling**: Defaults to production if invalid selection

### **State Updates**
- **Immediate Effect**: Changes take effect instantly
- **API Refresh**: Automatic base URL updates
- **UI Updates**: Real-time interface updates
- **Toast Notifications**: User feedback on environment changes

## 🔌 **API Integration**

### **Dynamic Base URL**
```typescript
// API service automatically uses current environment
export const API_CONFIG = {
  get BASE_URL() {
    return getCurrentBaseUrl();
  },
  // ... endpoints
};
```

### **Automatic Updates**
- **No Manual Refresh**: API calls automatically use new environment
- **Seamless Switching**: No interruption to user workflow
- **Data Consistency**: All operations use same environment

## 🧪 **Testing & Development**

### **Environment Switching**
1. **Login** to the application
2. **Navigate** to dashboard
3. **Click** on Environment selector
4. **Choose** desired environment
5. **Verify** API calls use new base URL

### **Development Workflow**
1. **Local Development**: Use localhost for development
2. **QA Testing**: Switch to QA environment for testing
3. **UAT Validation**: Use UAT for user acceptance testing
4. **Production**: Deploy to production environment

## 🚨 **Error Handling**

### **Invalid Environment Selection**
- **Validation**: Only valid environments can be selected
- **Fallback**: Invalid selections default to production
- **User Feedback**: Clear error messages for invalid operations

### **API Failures**
- **Graceful Degradation**: Failed API calls show appropriate errors
- **Retry Logic**: Automatic retry for transient failures
- **User Notification**: Clear feedback on API issues

## 🔮 **Future Enhancements**

### **Planned Features**
- **Environment Health Checks**: Monitor environment availability
- **Auto-switching**: Automatic fallback to healthy environments
- **Environment-specific Configs**: Different settings per environment
- **Audit Logging**: Track environment changes and usage

### **Technical Improvements**
- **WebSocket Integration**: Real-time environment status updates
- **Performance Monitoring**: Environment-specific performance metrics
- **Caching Strategy**: Environment-aware data caching
- **Offline Support**: Environment selection in offline mode

## 📱 **Responsive Design**

### **Mobile Optimization**
- **Touch-Friendly**: Proper touch targets for mobile devices
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Navigation**: Optimized for mobile workflows

### **Desktop Experience**
- **Full Features**: Complete functionality on desktop
- **Keyboard Navigation**: Full keyboard support
- **Large Displays**: Optimized for wide screens

## 🔒 **Security Considerations**

### **Environment Isolation**
- **Separate Credentials**: Different auth tokens per environment
- **Data Segregation**: Environment-specific data isolation
- **Access Control**: Environment-specific permissions

### **URL Validation**
- **Whitelist Approach**: Only predefined URLs allowed
- **HTTPS Enforcement**: Secure connections required
- **Domain Validation**: Verify legitimate SimplifyQA domains

## 📊 **Monitoring & Analytics**

### **Environment Usage**
- **Selection Tracking**: Monitor environment preferences
- **Switch Frequency**: Track how often users change environments
- **Performance Metrics**: Environment-specific performance data

### **User Behavior**
- **Popular Environments**: Identify most-used environments
- **Workflow Patterns**: Understand user workflows
- **Feature Adoption**: Track feature usage across environments

## 🛠️ **Troubleshooting**

### **Common Issues**
1. **Environment Not Switching**: Check localStorage permissions
2. **API Calls Failing**: Verify environment URL accessibility
3. **UI Not Updating**: Check component re-rendering
4. **State Persistence**: Verify localStorage functionality

### **Debug Mode**
```typescript
// Enable debug logging
const DEBUG_ENV = process.env.NODE_ENV === 'development';

if (DEBUG_ENV) {
  console.log('Environment State:', { 
    currentEnvironment, 
    availableEnvironments: Object.keys(environments),
    currentUrl: getCurrentUrl() 
  });
}
```

## 📚 **API Reference**

### **Environment Context Methods**
- `setEnvironment(env: string)`: Change current environment
- `getCurrentUrl()`: Get current environment URL
- `refreshApiConfig()`: Trigger API configuration refresh

### **Environment Object Properties**
- `name`: Human-readable environment name
- `url`: Environment base URL
- `description`: Environment description

## 🎯 **Best Practices**

### **Environment Selection**
- **Default to Production**: Use production for most users
- **Clear Labeling**: Descriptive environment names
- **User Guidance**: Help users choose appropriate environment

### **API Management**
- **Consistent Endpoints**: Same API structure across environments
- **Error Handling**: Environment-specific error messages
- **Performance**: Monitor response times per environment

### **User Experience**
- **Quick Switching**: Minimize time to change environments
- **Visual Feedback**: Clear indication of current environment
- **Persistent Selection**: Remember user preferences

## 🏁 **Conclusion**

The environment management system provides a robust, user-friendly way to switch between different SimplifyQA environments. With automatic API configuration, persistent state management, and professional UI design, it enhances the user experience while maintaining system reliability.

The system is designed to be:
- **User-Friendly**: Intuitive interface for environment selection
- **Developer-Friendly**: Easy to extend and maintain
- **Production-Ready**: Robust error handling and state management
- **Scalable**: Easy to add new environments and features

For questions or support, please refer to the development team or create an issue in the project repository. 