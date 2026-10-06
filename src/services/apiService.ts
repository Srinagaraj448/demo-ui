import { API_CONFIG } from '@/config/environment';
import { SIMPLIFYQA_ENVIRONMENTS } from '@/config/environment';
import { toast } from '@/hooks/use-toast';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  refreshToken?: string;
  accessToken?: string;
}

class ApiService {
  loggedInUserId: any = localStorage.getItem('userId');
  private sessionExpiredCallback: (() => void) | null = null;
  private sessionExpiredHandled: boolean = false;
  private isRefreshing: boolean = false;
  
  // Method to set the session expired callback from AuthContext
  setSessionExpiredCallback(callback: () => void) {
    this.sessionExpiredCallback = callback;
    this.sessionExpiredHandled = false; // Reset when new callback is set
  }

  // Method to reset session expiration state (useful for testing or manual resets)
  resetSessionExpiredState() {
    this.sessionExpiredHandled = false;
  }

  private getBaseUrl(): string {
    return API_CONFIG.BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private isJWTExpiredError(response: any, status?: number): boolean {
    // Check various JWT expiration indicators
    const errorIndicators = [
      'token',
      'unauthorized',
      'Unauthorized', 
      'jwt',
      'JWT',
      'expired',
      'invalid',
      'INVALIDTOKEN',
      'Not authorised to access resources'
    ];

    // Check HTTP status codes
    if (status === 401 || status === 403) return true;

    // Check error message content
    if (response?.error) {
      return errorIndicators.some(indicator => 
        response.error.toLowerCase().includes(indicator.toLowerCase())
      );
    }

    // Check response message content
    if (response?.message) {
      return errorIndicators.some(indicator => 
        response.message.toLowerCase().includes(indicator.toLowerCase())
      );
    }

    return false;
  }

  private handleJWTExpiration() {
    // Prevent multiple simultaneous session expiration handling
    if (this.sessionExpiredHandled) {
      console.log('Session expiration already handled, skipping');
      return;
    }
    
    this.sessionExpiredHandled = true;
    console.log('Handling JWT expiration');

    // Clear stored authentication data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    this.loggedInUserId = null;

    // Trigger session expired callback if available
    if (this.sessionExpiredCallback) {
      // Use setTimeout to ensure the callback is called after current execution context
      setTimeout(() => {
        if (this.sessionExpiredCallback) {
          this.sessionExpiredCallback();
        }
      }, 0);
    }
  }

  private async requestForLogin<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check for JWT expiration
        if (this.isJWTExpiredError(data, response.status)) {
          this.handleJWTExpiration();
        }

        return {
          success: false,
          error: data.message || 'An error occurred'
        };
      }

      return {
        success: true,
        data,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('accessToken');
      const url = `${this.getBaseUrl()}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}`, 'env': localStorage.getItem('simplifyqa_environment') })
        }
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for JWT expiration
        if (this.isJWTExpiredError(data, response.status)) {
          this.handleJWTExpiration();
        }

        const errorMsg = data.message || 'An error occurred';
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again later.',
          variant: 'destructive'
        });
        return {
          success: false,
          error: errorMsg
        };
      }

      return {
        success: true,
        data,
        token: data.token
      };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Refresh token API
  async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      if (this.isRefreshing) {
        return { success: false, error: 'Refresh already in progress' };
      }
      this.isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.isRefreshing = false;
        return { success: false, error: 'No refresh token found' };
      }

      const response = await fetch(`${this.getBaseUrl()}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        this.isRefreshing = false;
        // If refresh failed, treat as session expired
        this.handleJWTExpiration();
        return {
          success: false,
          error: data?.message || 'Failed to refresh token'
        };
      }

      const newAccessToken = data?.accessToken || data?.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
      }

      this.isRefreshing = false;
      return {
        success: true,
        data: { accessToken: newAccessToken }
      };
    } catch (error) {
      this.isRefreshing = false;
      this.handleJWTExpiration();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Authentication APIs
  async verifyEmail(email: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.EMAIL_VERIFY, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    return this.requestForLogin(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
  }

  async getCustomerById(customerId: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CUSTOMER_GET_BY_ID}/${customerId}`, {
      method: 'GET'
    });
  }

  // Customer APIs
  async searchCustomers(payload: any): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.CUSTOMER_SEARCH, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getAllCustomers(): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CUSTOMER_SEARCH}`, {
      method: 'GET'
    });
  }

  async createCustomer(customerData: any): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.CUSTOMER_CREATE, {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  async updateCustomer(customerId: string, customerData: any): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CUSTOMER_UPDATE}/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  // Package APIs
  async getAllPackages(): Promise<ApiResponse> {
    // Build query string from params
    return this.request(`${API_CONFIG.ENDPOINTS.PACKAGE_SEARCH}`, {
      method: 'GET'
    });
  }

  async getPackageById(packageId: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.PACKAGE_GET_BY_ID}/${packageId}`, {
      method: 'GET'
    });
  }

  async createPackage(packageData: any): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.PACKAGE_CREATE, {
      method: 'POST',
      body: JSON.stringify(packageData)
    });
  }

  async updatePackage(packageId: string, packageData: any): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.PACKAGE_UPDATE}/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(packageData)
    });
  }

  // // Customer Report APIs
  // async getCustomerInfo(customerId: string): Promise<ApiResponse> {
  //   return this.request(`/customers/${customerId}/info`, {
  //     method: 'GET'
  //   });
  // }

  async getProjectUsers(customerId: string, reportType: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ reportType });
    return this.request(`/lm/customer/${customerId}/report?${params.toString()}`, {
      method: 'GET'
    });
  }

  async getProjectExecutions(customerId: string, reportType: string, startDate?: string, endDate?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ reportType });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/lm/customer/${customerId}/report?${params.toString()}`, {
      method: 'GET'
    });
  }

  async getSuiteExecutions(payload: { customerId: string; startDate: string; endDate: string; reportType: string }): Promise<ApiResponse> {
    const params = new URLSearchParams({ reportType: payload.reportType, startDate: payload.startDate, endDate: payload.endDate });
    return this.request(`/lm/customer/${payload.customerId}/report?${params.toString()}`, {
      method: 'GET'
    });
  }

  async getTCTypeCounts(customerId: string, reportType: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ reportType });
    return this.request(`/lm/customer/${customerId}/report?${params.toString()}`, {
      method: 'GET'
    });
  }

  async getAutomationData(customerId: string, reportType: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ reportType });
    return this.request(`/lm/customer/${customerId}/report?${params.toString()}`, {
      method: 'GET'
    });
  }


  async getStaticCloudDevices(): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLOUD_DEVICES_STATIC}`, {
      method: 'GET'
    });
  }

  async getAllRegisteredDevices(): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLOUD_DEVICES_REGISTERED}`, {
      method: 'GET'
    });
  }

  async createCloudDevice(payload: any): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLOUD_DEVICES_CREATE}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateCloudDevice(id: string, payload: any): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.CLOUD_DEVICES_UPDATE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }); 
  }

}

export const apiService = new ApiService();