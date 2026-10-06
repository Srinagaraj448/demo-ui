// SimplifyQA Environment URLs
export const SIMPLIFYQA_ENVIRONMENTS = {
  QA: {
    name: 'QA Environment',
    url: 'https://qa-simplifyqa.devopsark.com',
    description: 'Quality Assurance testing environment'
  },
  UAT: {
    name: 'UAT Environment',
    url: 'https://uat.simplifyqa.com',
    description: 'User Acceptance Testing environment'
  },
  PROD: {
    name: 'Production Environment',
    url: 'http://localhost:4009',
    description: 'Live production environment'
  }
};

// Default environment (QA)
export const DEFAULT_ENVIRONMENT = 'QA';

// Get current base URL from localStorage or use default
export const getCurrentBaseUrl = (): string => {
  let env = localStorage.getItem('simplifyqa_environment');
  if (!env) {
    env = DEFAULT_ENVIRONMENT;
    localStorage.setItem('simplifyqa_environment', env);
  }

  return SIMPLIFYQA_ENVIRONMENTS[env as keyof typeof SIMPLIFYQA_ENVIRONMENTS]?.url || SIMPLIFYQA_ENVIRONMENTS.QA.url;
};

export const API_CONFIG = {
  get BASE_URL() {
    return getCurrentBaseUrl();
  },
  ENDPOINTS: {
    // Authentication
    EMAIL_VERIFY: '/lm/auth/email',
    LOGIN: '/lm/auth/login',
    REFRESH_TOKEN: '/lm/auth/refresh-token',
    
    // Customer Management
    CUSTOMER_SEARCH: '/lm/customer',
    CUSTOMER_CREATE: '/lm/customer/create',
    CUSTOMER_UPDATE: '/lm/customer/update',
    CUSTOMER_GET_BY_ID: '/lm/customer/getById',
    
    // Package Management
    PACKAGE_SEARCH: '/lm/package/allPackages',
    PACKAGE_CREATE: '/lm/package/create',
    PACKAGE_UPDATE: '/lm/package/update',
    PACKAGE_GET_BY_ID: '/lm/package/getById',
    
    // Cloud Device Management
    CLOUD_DEVICES_STATIC: '/lm/device/staticCloudDevices',
    CLOUD_DEVICES_REGISTERED: '/lm/device/registeredloudDevices',
    CLOUD_DEVICES_CREATE: '/lm/device/create',
    CLOUD_DEVICES_UPDATE: '/lm/device/update'
  }
};

export const PACKAGE_OPTIONS = [
  { id: 1, packageName: "All privileges", licenseCost: 100.0, start_date: "2022-12-31T18:30:00.000Z" },
  { id: 2, packageName: "Privileges without cloud", licenseCost: 80.0, start_date: "2022-12-31T18:30:00.000Z" }
];

export const CUSTOMER_STATUS_OPTIONS = [
  "active",
  "inactive",
  "trial"
];