import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Smartphone, Monitor, Tablet, Search, Filter, RefreshCw, Grid3X3, List, Users, Settings, Activity, TrendingUp, ChevronDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';

interface CloudDevice {
  cloudDeviceId: string;
  deviceName: string;
  osVersion: string;
  deviceType: string;
  technologyType: string;
}

interface RegisteredDevice extends CloudDevice {
  id: string;
  customerId?: string;
  customerName?: string;
  status: string;
  createdAt?: string;
}

interface Customer {
  customer_id: string;
  cust_name: string;
  companyName: string;
}

const CloudDeviceIntegration = () => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // State for devices and customers
  const [staticDevices, setStaticDevices] = useState<CloudDevice[]>([]);
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // State for add device form
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState('');
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [deviceSearchValue, setDeviceSearchValue] = useState('');
  const [tableCustomerDropdownOpen, setTableCustomerDropdownOpen] = useState<{[key: string]: boolean}>({});
  const [tableCustomerSearchValues, setTableCustomerSearchValues] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Device type icons
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
      case 'phone':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Get selected customer name
  const getSelectedCustomerName = () => {
    if (selectedCustomer === 'unassigned') return 'Leave Unassigned';
    const customer = customers.find(c => c.customer_id === selectedCustomer);
    return customer ? customer.cust_name : 'Select customer...';
  };

  // Debug: Check for duplicate customers
  const uniqueCustomers = customers.filter((customer, index, self) => 
    index === self.findIndex(c => c.customer_id === customer.customer_id)
  );
  
  // Filter customers based on search value with precise matching
  const getFilteredCustomers = () => {
    if (!customerSearchValue.trim()) return uniqueCustomers;
    
    const searchTerm = customerSearchValue.toLowerCase().trim();
    return uniqueCustomers.filter(customer => 
      customer.cust_name.toLowerCase().includes(searchTerm) ||
      customer.companyName.toLowerCase().includes(searchTerm)
    );
  };

  // Filter customers for table with precise matching
  const getFilteredCustomersForTable = (deviceId: string) => {
    const searchValue = tableCustomerSearchValues[deviceId] || '';
    if (!searchValue.trim()) return uniqueCustomers;
    
    const searchTerm = searchValue.toLowerCase().trim();
    return uniqueCustomers.filter(customer => 
      customer.cust_name.toLowerCase().includes(searchTerm) ||
      customer.companyName.toLowerCase().includes(searchTerm)
    );
  };

  // Filter devices based on search value with precise matching
  const getFilteredDevices = () => {
    if (!deviceSearchValue.trim()) return availableDevicesForDropdown;
    
    const searchTerm = deviceSearchValue.toLowerCase().trim();
    return availableDevicesForDropdown.filter(device => 
      device.deviceName.toLowerCase().includes(searchTerm) ||
      device.cloudDeviceId.toLowerCase().includes(searchTerm) ||
      device.osVersion.toLowerCase().includes(searchTerm) ||
      device.deviceType.toLowerCase().includes(searchTerm)
    );
  };

  // Get selected device name
  const getSelectedDeviceName = () => {
    const device = staticDevices.find(d => d.cloudDeviceId === selectedDevice);
    return device ? device.deviceName : 'Choose device...';
  };

  // Get selected customer name for table
  const getSelectedCustomerNameForTable = (customerId: string | undefined) => {
    if (!customerId || customerId === 'unassigned') return 'Unassigned';
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? customer.cust_name : 'Unknown';
  };

  // Fetch all data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadInitialData = async () => {
    setIsLoading(true);
    
    try {
      const [devicesResponse, registeredResponse, customersResponse] = await Promise.all([
        apiService.getStaticCloudDevices(),
        apiService.getAllRegisteredDevices(),
        apiService.getAllCustomers()
      ]);

      if (devicesResponse.success && devicesResponse.data) {
        const mappedDevices = devicesResponse.data.map((device: any) => ({
          cloudDeviceId: device.id,
          deviceName: device.deviceName,
          osVersion: device.osVersion,
          deviceType: device.deviceType || device.technologyType?.toLowerCase() || 'unknown'
        }));
        setStaticDevices(mappedDevices);
      } else if (!devicesResponse.success) {
        toast({
          title: "Error loading devices",
          description: devicesResponse.error || "Failed to load device data",
          variant: "destructive"
        });
      }

      if (registeredResponse.success && registeredResponse.data) {
        const mappedRegistered = registeredResponse.data.map((device: any) => ({
          id: device._id,
          cloudDeviceId: device.cloudDeviceId,
          deviceName: device.deviceName,
          osVersion: device.osVersion,
          deviceType: device.deviceType || device.technologyType?.toLowerCase() || 'unknown',
          customerId: device.customerId?.toString(),
          customerName: device.customerId ? 
            customersResponse.data?.find((c: any) => c.id === device.customerId)?.cust_name || 'Unknown Customer' : 
            'Unassigned',
          status: device.status
        }));
        setRegisteredDevices(mappedRegistered);
      } else if (!registeredResponse.success) {
        toast({
          title: "Error loading registered devices",
          description: registeredResponse.error || "Failed to load registered device data",
          variant: "destructive"
        });
      }

      if (customersResponse.success && customersResponse.data) {
        const mappedCustomers = customersResponse.data.map((customer: any) => ({
          customer_id: customer.id?.toString(),
          cust_name: customer.cust_name,
          companyName: customer.companyName
        }));
        setCustomers(mappedCustomers);
      } else if (!customersResponse.success) {
        toast({
          title: "Error loading customers",
          description: customersResponse.error || "Failed to load customer data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load cloud device data. Please try refreshing.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      toast({
        title: "Data Refreshed",
        description: "Cloud device data has been updated"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive"
      });
    }
    setRefreshing(false);
  };

  // Generate dummy data for development/fallback
  const generateDummyDevices = (): CloudDevice[] => {
    const deviceTypes = ['mobile', 'tablet', 'desktop'];
    const osVersions = ['iOS 17.1', 'Android 14', 'iOS 16.5', 'Android 13', 'Windows 11', 'macOS 14'];
    const brands = ['iPhone', 'Samsung', 'Google Pixel', 'iPad', 'MacBook', 'Surface'];
    const technologyTypes = ['iOS', 'Android', 'Windows', 'macOS'];
    return Array.from({ length: 100 }, (_, i) => ({
      cloudDeviceId: `device_${(i + 1).toString().padStart(3, '0')}`,
      deviceName: `${brands[i % brands.length]} ${Math.floor(Math.random() * 20) + 1}`,
      osVersion: osVersions[i % osVersions.length],
      deviceType: deviceTypes[i % deviceTypes.length],
      technologyType: technologyTypes[i % technologyTypes.length]
    }));
  };

  const generateDummyRegisteredDevices = (): RegisteredDevice[] => {
    const dummy = generateDummyDevices().slice(0, 15);
    return dummy.map((device, i) => ({
      ...device,
      id: `reg_${i + 1}`,
      customerId: i < 10 ? `cust_${(i % 5) + 1}` : undefined,
      customerName: i < 10 ? `Customer ${(i % 5) + 1}` : 'Unassigned',
      status: 'Available'
    }));
  };

  const generateDummyCustomers = (): Customer[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      customer_id: `cust_${i + 1}`,
      cust_name: `Customer ${i + 1}`,
      companyName: `Company ${i + 1} Ltd.`
    }));
  };

  const handleAddDevice = async () => {
    if (!selectedDevice) {
      toast({
        title: "Error",
        description: "Please select a device to add",
        variant: "destructive"
      });
      return;
    }

    const deviceToAdd = staticDevices.find(d => d.cloudDeviceId === selectedDevice);
    if (!deviceToAdd) return;

    const customer = selectedCustomer && selectedCustomer !== 'unassigned' 
      ? customers.find(c => c.customer_id === selectedCustomer)
      : null;

    const newRegisteredDevice: RegisteredDevice = {
        deviceName: deviceToAdd.deviceName,
        cloudDeviceId: "",
        osVersion: deviceToAdd.osVersion,
        technologyType: deviceToAdd.technologyType,
        deviceType: deviceToAdd.deviceType,
        id: deviceToAdd.cloudDeviceId,
        customerId: customer?.customer_id,
        customerName: customer?.cust_name || 'Unassigned',
        status: "Pending"
    };

    try {
      const response = await apiService.createCloudDevice({devices: [newRegisteredDevice]});
      
      if (response.success) {
        // Add the new device to the TOP of the registered devices list for immediate visibility
        setRegisteredDevices(prev => [newRegisteredDevice, ...prev]);
        
        // Clear form fields
        setSelectedDevice('');
        setSelectedCustomer('');
        setDeviceSearchValue('');
        setCustomerSearchValue('');
        
        // Ensure table view is active to see the new device
        setViewMode('table');
        
        toast({
          title: "Device Added Successfully",
          description: `${deviceToAdd.deviceName} has been ${customer ? `assigned to ${customer.cust_name}` : 'added as unassigned'} and appears at the top of the list`
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to add device",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding the device",
        variant: "destructive"
      });
    }
  };

  const handleCustomerChange = async (deviceId: string, customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    
    try {
      const response = await apiService.updateCloudDevice(deviceId, {customerId: customerId});
      
      if (response.success) {
        setRegisteredDevices(prev => 
          prev.map(device => 
            device.id === deviceId 
              ? { 
                  ...device, 
                  customerId: customerId === 'unassigned' ? undefined : customerId,
                  customerName: customerId === 'unassigned' ? 'Unassigned' : customer?.cust_name || 'Unknown'
                }
              : device
          )
        );
        
        toast({
          title: "Customer Updated",
          description: `Device assignment has been updated`
        });
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update device assignment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating device assignment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating device assignment",
        variant: "destructive"
      });
    }
  };

  // Filter devices for dropdown - exclude already registered devices
  const availableDevicesForDropdown = staticDevices.filter(device =>
    !registeredDevices.some(registered => registered.cloudDeviceId === device.cloudDeviceId)
  );

  // Filter devices for dropdown
  const filteredStaticDevices = staticDevices.filter(device =>
    device.deviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    device.cloudDeviceId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Filter registered devices for table
  const filteredRegisteredDevices = registeredDevices.filter(device => {
    const matchesSearch = 
      device.deviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      device.cloudDeviceId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (device.customerName && device.customerName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'assigned' && device.customerId) ||
      (filterType === 'unassigned' && !device.customerId) ||
      device.deviceType.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <Smartphone className="absolute inset-6 text-blue-600" />
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Loading Cloud Devices</p>
          <p className="text-gray-500">Fetching device data and customer information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Cloud Device Hub
                </h1>
                <p className="text-sm text-gray-600 mt-1">Intelligent device management & customer assignments</p>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{registeredDevices.length}</div>
                <div className="text-xs text-gray-600">Total Devices</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{customers.length}</div>
                <div className="text-xs text-gray-600">Customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
          {/* Device Assignment Card */}
          <Card className="bg-white border shadow-sm">
            <CardHeader className="pb-4">
              <p className="text-base text-gray-600">Select and assign devices to customers with real-time validation</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    Select Device
                  </Label>
                  <Popover open={deviceDropdownOpen} onOpenChange={setDeviceDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={deviceDropdownOpen}
                        className="w-full h-12 justify-between border-gray-300 focus:border-gray-400 bg-white hover:bg-gray-50 text-left"
                      >
                        <span 
                          className={`truncate pr-2 ${selectedDevice === '' ? 'text-gray-500' : 'text-gray-900'}`}
                          title={getSelectedDeviceName()}
                        >
                          {getSelectedDeviceName()}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search devices..." 
                          value={deviceSearchValue}
                          onValueChange={setDeviceSearchValue}
                        />
                        <CommandList className="max-h-60">
                          <CommandEmpty>No devices found.</CommandEmpty>
                          <CommandGroup>
                            {getFilteredDevices().map((device) => (
                              <CommandItem
                                key={device.cloudDeviceId}
                                value={device.cloudDeviceId}
                                onSelect={() => {
                                  setSelectedDevice(device.cloudDeviceId);
                                  setDeviceDropdownOpen(false);
                                  setDeviceSearchValue('');
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${selectedDevice === device.cloudDeviceId ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <div className="flex items-center gap-3 w-full min-w-0">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {getDeviceIcon(device.deviceType)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate" title={device.deviceName}>
                                      {device.deviceName}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate" title={`${device.cloudDeviceId} • ${device.osVersion}`}>
                                      {device.cloudDeviceId} • {device.osVersion}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    Assign Customer
                  </Label>
                  <Popover open={customerDropdownOpen} onOpenChange={setCustomerDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerDropdownOpen}
                        className="w-full h-12 justify-between border-gray-300 focus:border-gray-400 bg-white hover:bg-gray-50 text-left"
                      >
                        <span 
                          className={`truncate pr-2 ${selectedCustomer === '' ? 'text-gray-500' : 'text-gray-900'}`}
                          title={getSelectedCustomerName()}
                        >
                          {getSelectedCustomerName()}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search customers..." 
                          value={customerSearchValue}
                          onValueChange={setCustomerSearchValue}
                        />
                        <CommandList className="max-h-60">
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="unassigned"
                              onSelect={() => {
                                setSelectedCustomer('unassigned');
                                setCustomerDropdownOpen(false);
                                setCustomerSearchValue('');
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedCustomer === 'unassigned' ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span className="text-gray-500 italic">Leave Unassigned</span>
                            </CommandItem>
                            {getFilteredCustomers().map((customer) => (
                              <CommandItem
                                key={customer.customer_id}
                                value={customer.customer_id}
                                onSelect={() => {
                                  setSelectedCustomer(customer.customer_id);
                                  setCustomerDropdownOpen(false);
                                  setCustomerSearchValue('');
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${selectedCustomer === customer.customer_id ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate" title={customer.cust_name}>
                                    {customer.cust_name}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate" title={customer.companyName}>
                                    {customer.companyName}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddDevice} 
                    disabled={!selectedDevice}
                    className="w-full h-12"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Assign Device
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Table */}
          <div className="bg-white rounded-lg shadow-sm border" style={{ height: '610px', overflow: 'auto' }}>
            {/* Table Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Device Inventory
                </h2>
                
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={refreshData} 
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  <Badge variant="secondary" className="flex-shrink-0">
                    {filteredRegisteredDevices.length} Total
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Table Container */}
            <div 
              className="overflow-auto"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              <table className="w-full">
                {/* Table Header */}
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Device ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Device Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">OS Version</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Device Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer Assignment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                
                {/* Table Body */}
                <tbody className="divide-y divide-gray-100">
                  {filteredRegisteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Smartphone className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No devices found</p>
                          <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRegisteredDevices.map((device) => (
                      <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <span className="font-mono text-gray-900 font-medium">{device.cloudDeviceId}</span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getDeviceIcon(device.deviceType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900">{device.deviceName}</div>
                                {(device as any).createdAt && new Date((device as any).createdAt) > new Date(Date.now() - 30000) && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                                    NEW
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(device as any).createdAt && new Date((device as any).createdAt) > new Date(Date.now() - 60000) 
                                  ? 'Just added' 
                                  : 'Last sync: 2 hours ago'
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge variant="outline" className="text-gray-600">
                            {device.osVersion}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge variant="outline" className="text-gray-600 capitalize">
                            {device.deviceType}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Popover 
                            open={tableCustomerDropdownOpen[device.id] || false} 
                            onOpenChange={(open) => 
                              setTableCustomerDropdownOpen(prev => ({...prev, [device.id]: open}))
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={tableCustomerDropdownOpen[device.id] || false}
                                className="w-[200px] justify-between border-gray-300 bg-white hover:bg-gray-50 text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${device.customerId && device.customerId !== 'unassigned' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                  <span 
                                    className={`truncate ${device.customerId && device.customerId !== 'unassigned' ? 'text-gray-900' : 'text-gray-500'}`}
                                    title={getSelectedCustomerNameForTable(device.customerId)}
                                  >
                                    {getSelectedCustomerNameForTable(device.customerId)}
                                  </span>
                                </div>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                                                                                      <PopoverContent className="w-[200px] p-0" align="start">
                               <Command shouldFilter={false}>
                                 <CommandInput 
                                   placeholder="Search customers..." 
                                   value={tableCustomerSearchValues[device.id] || ''}
                                   onValueChange={(value) => 
                                     setTableCustomerSearchValues(prev => ({...prev, [device.id]: value}))
                                   }
                                 />
                                 <CommandList className="max-h-48">
                                   <CommandEmpty>No customers found.</CommandEmpty>
                                   <CommandGroup>
                                     <CommandItem
                                       value="unassigned"
                                       onSelect={() => {
                                         handleCustomerChange(device.id, 'unassigned');
                                         setTableCustomerDropdownOpen(prev => ({...prev, [device.id]: false}));
                                         setTableCustomerSearchValues(prev => ({...prev, [device.id]: ''}));
                                       }}
                                     >
                                       <Check
                                         className={`mr-2 h-4 w-4 ${(!device.customerId || device.customerId === 'unassigned') ? 'opacity-100' : 'opacity-0'}`}
                                       />
                                       <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                         <span className="text-gray-500 italic">Unassigned</span>
                                       </div>
                                     </CommandItem>
                                     {getFilteredCustomersForTable(device.id).map((customer) => (
                                       <CommandItem
                                         key={customer.customer_id}
                                         value={customer.customer_id}
                                         onSelect={() => {
                                           handleCustomerChange(device.id, customer.customer_id);
                                           setTableCustomerDropdownOpen(prev => ({...prev, [device.id]: false}));
                                           setTableCustomerSearchValues(prev => ({...prev, [device.id]: ''}));
                                         }}
                                       >
                                         <Check
                                           className={`mr-2 h-4 w-4 ${device.customerId === customer.customer_id ? 'opacity-100' : 'opacity-0'}`}
                                         />
                                         <div className="flex items-center gap-2 min-w-0 w-full">
                                           <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                           <div className="flex-1 min-w-0">
                                             <div className="font-medium text-gray-900 truncate" title={customer.cust_name}>
                                               {customer.cust_name}
                                             </div>
                                             <div className="text-xs text-gray-500 truncate" title={customer.companyName}>
                                               {customer.companyName}
                                             </div>
                                           </div>
                                         </div>
                                       </CommandItem>
                                     ))}
                                   </CommandGroup>
                                 </CommandList>
                               </Command>
                             </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${device.status === 'Available' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                            <span className={`text-sm font-medium ${device.status === 'Available' ? 'text-green-600' : 'text-blue-600'}`}>
                              {device.status?.toLowerCase() == "offline" || device.status?.toLowerCase() == "pending" ? 'Pending' : 'Registered'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CloudDeviceIntegration;