import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Download, Calendar as CalendarIcon, BarChart3, Users, Activity, TestTube, Gauge, Loader2, User, Clock, Shield, FileText, Code, Zap, Hash, Smartphone, Globe, Database, Monitor, Percent, UserCheck, Play, FlaskConical, PieChart, Target, Layers3, FolderOpen, Server, Laptop, Building2, Calculator } from 'lucide-react';
import { format, subMonths, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import * as XLSX from 'xlsx';

interface ProjectUser {
  id: number | string;
  username: string;
  lastLogin: string;
  active: string;
}

interface ProjectExecution {
  projectId: number;
  projectName: string;
  execCode: string;
  execTypeCode: string;
  lastExecutionTime: string;
  status: string;
}

interface SuiteExecution {
  projectId: number;
  projectName: string;
  suiteCode: string;
  executionCount: number;
}

interface TCTypeCount {
  projectId: number;
  projectName: string;
  executionType: string;
  API: number;
  WEB: number;
  ANDROID: number;
  IOS: number;
  DATABASE: number;
  MAINFRAME: number;
  DESKTOP: number;
  SAP: number;
  totalTCs: number;
}

interface AutomationData {
  projectId: number;
  projectName: string;
  totalTCs: number;
  automatedTCs: number;
  automationPercentage: number;
}

interface CustomerInfo {
  id: string;
  cust_name: string;
  companyName: string;
  projectCount?: number;
  totalUsers?: number;
  totalTestCases?: number;
  automationPercentage?: number;
}

const CustomerReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  let currentCustomerProjectsCount = 0
  
  // State for filters
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Search terms for different tabs
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [executionsSearchTerm, setExecutionsSearchTerm] = useState('');
  const [suitesSearchTerm, setSuitesSearchTerm] = useState('');
  const [tcTypesSearchTerm, setTcTypesSearchTerm] = useState('');
  const [automationSearchTerm, setAutomationSearchTerm] = useState('');
  
  // Date validation state
  const [dateError, setDateError] = useState<string>('');
  
  // Data states
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  
  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [executionsPage, setExecutionsPage] = useState(1);
  const [suitesPage, setSuitesPage] = useState(1);
  const [tcTypesPage, setTcTypesPage] = useState(1);
  const [automationPage, setAutomationPage] = useState(1);
  
  // Loading states
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);
  const [isLoadingSuites, setIsLoadingSuites] = useState(false);
  const [isLoadingTCTypes, setIsLoadingTCTypes] = useState(false);
  const [isLoadingAutomation, setIsLoadingAutomation] = useState(false);
  

  // Load customer basic information
  useEffect(() => {
    if (id) {
      loadCustomerInfo();
    }
  }, [id]);

  // Load project users data 
  useEffect(() => {
    if (id) {
      loadProjectUsers();
    }
  }, [id]);

  // Initial date validation
  useEffect(() => {
    validateDates(startDate, endDate);
  }, []);

  // Date validation function
  const validateDates = (start: Date, end: Date): boolean => {
    if (start >= end) {
      setDateError('Start date must be before end date');
      return false;
    }
    if (start.getTime() === end.getTime()) {
      setDateError('Start date and end date cannot be the same');
      return false;
    }
    setDateError('');
    return true;
  };

  // Handle date changes with validation
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      validateDates(date, endDate);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      validateDates(startDate, date);
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
  };

  const loadCustomerInfo = async () => {
    setIsLoadingCustomer(true);
    try {
      const response = await apiService.getCustomerById(id);
      if (response.success && response.data) {
        console.log('Customer info loaded:', response.data);
        // Set default projectCount if not provided
        setCustomerInfo({
          ...response.data,
          projectCount: response.data.projectCount ?? 0
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load customer information",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customer information",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Store all data fetched from API
  const [allProjectUsers, setAllProjectUsers] = useState<ProjectUser[]>([]);
  const [allProjectExecutions, setAllProjectExecutions] = useState<ProjectExecution[]>([]);
  const [allSuiteExecutions, setAllSuiteExecutions] = useState<SuiteExecution[]>([]);
  const [allTCTypeCounts, setAllTCTypeCounts] = useState<TCTypeCount[]>([]);
  const [allAutomationData, setAllAutomationData] = useState<AutomationData[]>([]);

  const loadProjectUsers = async () => {
    setIsLoadingUsers(true);
    setUsersPage(1);
    
    try {
      const response = await apiService.getProjectUsers(id!, 'user-details-with-last-login');
      
      if (response.success && response.data) {
        const allData = response.data.data || [];
        setAllProjectUsers(allData);
        
        // Update customer info with project count if available
        if (response.data.projectCounts) {
          console.log('Updating project count:', response.data.projectCounts);
          setCustomerInfo(prev => prev ? {
            ...prev,
            projectCount: response.data.projectCounts
          } : null);
        } else {
          console.log('No projectCounts in response, response.data:', response.data);
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load project users",
          variant: "destructive"
        });
        }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project users",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadMoreUsers = () => {
    if (usersPage * 20 >= filteredAllProjectUsers.length) return;
    setUsersPage(prev => prev + 1);
  };

  const loadProjectExecutions = async () => {
    setIsLoadingExecutions(true);
    setExecutionsPage(1);
    
    try {
      const response = await apiService.getProjectExecutions(
        id!, 
        'project-execution-details',
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      if (response.success && response.data) {
        const allData = response.data.data || response.data || [];
        console.log('Loaded project executions:', allData.length, 'records');
        setAllProjectExecutions(allData);
      } else {
        console.error('Failed to load executions:', response.error);
        setAllProjectExecutions([]);
        setAllProjectExecutions([]);
        toast({
          title: "Error",
          description: response.error || "Failed to load project executions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Exception loading executions:', error);
      setAllProjectExecutions([]);
      setAllProjectExecutions([]);
      toast({
        title: "Error",
        description: "Failed to load project executions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  const loadMoreExecutions = () => {
    if (executionsPage * 20 >= filteredAllProjectExecutions.length) return;
    setExecutionsPage(prev => prev + 1);
  };

  const loadSuiteExecutions = async () => {
    setIsLoadingSuites(true);
    setSuitesPage(1);
    
    try {
      const payload = {
        customerId: id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reportType: 'project-suite-count'
      };
      const response = await apiService.getSuiteExecutions(payload);
      if (response.success && response.data) {
        const allData = response.data.data || response.data || [];
        setAllSuiteExecutions(allData);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load suite executions",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load suite executions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuites(false);
    }
  };

  const loadMoreSuites = () => {
    if (suitesPage * 20 >= filteredAllSuiteExecutions.length) return;
    setSuitesPage(prev => prev + 1);
  };

  const loadTCTypeCounts = async () => {
    setIsLoadingTCTypes(true);
    setTcTypesPage(1);
    
    try {
      const response = await apiService.getTCTypeCounts(id!, 'project-tc-type-count');
      if (response.success && response.data) {
        const allData = response.data || [];
        setAllTCTypeCounts(allData);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load test case type counts",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load test case type counts",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTCTypes(false);
    }
  };

  const loadMoreTCTypes = () => {
    if (tcTypesPage * 20 >= filteredAllTcTypeCounts.length) return;
    setTcTypesPage(prev => prev + 1);
  };

  const loadAutomationData = async () => {
    setIsLoadingAutomation(true);
    setAutomationPage(1);
    
    try {
      const response = await apiService.getAutomationData(id!, 'project-tc-automation-percentage');
      if (response.success && response.data) {
        const allData = response.data.data || response.data || [];
        setAllAutomationData(allData);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to load automation data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAutomation(false);
    }
  };

  const loadMoreAutomation = () => {
    if (automationPage * 20 >= filteredAllAutomationData.length) return;
    setAutomationPage(prev => prev + 1);
  };

  // Create scroll handler
  const createScrollHandler = (loadMoreFunction: () => void) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        loadMoreFunction();
      }
    };
  };

  // Load data when tabs are activated
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'users':
        if (allProjectUsers.length === 0) loadProjectUsers();
        break;
      case 'executions':
        if (allProjectExecutions.length === 0) loadProjectExecutions();
        break;
      case 'suites':
        if (allSuiteExecutions.length === 0) loadSuiteExecutions();
        break;
      case 'tctypes':
        if (allTCTypeCounts.length === 0) loadTCTypeCounts();
        break;
      case 'automation':
        if (allAutomationData.length === 0) loadAutomationData();
        break;
    }
  };

  // Export to Excel function
  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Export successful",
        description: `${filename}.xlsx has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data to Excel",
        variant: "destructive"
      });
    }
  };

  const getAutomationBadgeColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Filter functions for each data type - search in ALL data, then paginate
  const filteredAllProjectUsers = allProjectUsers.filter(user => {
    if (!usersSearchTerm.trim()) return true;
    const searchLower = usersSearchTerm.toLowerCase();
    return (user.username || '').toLowerCase().includes(searchLower) ||
           (user.id?.toString() || '').toLowerCase().includes(searchLower) ||
           (user.active || '').toLowerCase().includes(searchLower);
  });

  const filteredAllProjectExecutions = allProjectExecutions.filter(execution => {
    if (!executionsSearchTerm.trim()) return true;
    const searchLower = executionsSearchTerm.toLowerCase();
    
    // Safe string conversion and search
    const projectNameMatch = execution.projectName ? 
      execution.projectName.toString().toLowerCase().includes(searchLower) : false;
    const execCodeMatch = execution.execCode ? 
      execution.execCode.toString().toLowerCase().includes(searchLower) : false;
    const execTypeCodeMatch = execution.execTypeCode ? 
      execution.execTypeCode.toString().toLowerCase().includes(searchLower) : false;
    
    return projectNameMatch || execCodeMatch || execTypeCodeMatch;
  });

  // Debug: Log search results
  React.useEffect(() => {
    if (executionsSearchTerm.trim()) {
      console.log('Executions Search Term:', executionsSearchTerm);
      console.log('Total Executions:', allProjectExecutions.length);
      console.log('Filtered Results:', filteredAllProjectExecutions.length);
      console.log('Sample Data:', allProjectExecutions.slice(0, 2));
    }
  }, [executionsSearchTerm, allProjectExecutions.length, filteredAllProjectExecutions.length]);

  const filteredAllSuiteExecutions = allSuiteExecutions.filter(suite => {
    if (!suitesSearchTerm.trim()) return true;
    const searchLower = suitesSearchTerm.toLowerCase();
    
    // Safe string conversion and search
    const projectNameMatch = suite.projectName ? 
      suite.projectName.toString().toLowerCase().includes(searchLower) : false;
    const suiteCodeMatch = suite.suiteCode ? 
      suite.suiteCode.toString().toLowerCase().includes(searchLower) : false;
    const projectIdMatch = suite.projectId ? 
      suite.projectId.toString().toLowerCase().includes(searchLower) : false;
    
    return projectNameMatch || suiteCodeMatch || projectIdMatch;
  });

  // Debug: Log Suite Executions search results
  React.useEffect(() => {
    if (suitesSearchTerm.trim()) {
      console.log('Suites Search Term:', suitesSearchTerm);
      console.log('Total Suites:', allSuiteExecutions.length);
      console.log('Filtered Results:', filteredAllSuiteExecutions.length);
      console.log('Sample Data:', allSuiteExecutions.slice(0, 2));
    }
  }, [suitesSearchTerm, allSuiteExecutions.length, filteredAllSuiteExecutions.length]);

  const filteredAllTcTypeCounts = allTCTypeCounts.filter(tcType => {
    if (!tcTypesSearchTerm.trim()) return true;
    const searchLower = tcTypesSearchTerm.toLowerCase();
    
    // Safe string conversion and search
    const projectNameMatch = tcType.projectName ? 
      tcType.projectName.toString().toLowerCase().includes(searchLower) : false;
    const executionTypeMatch = tcType.executionType ? 
      tcType.executionType.toString().toLowerCase().includes(searchLower) : false;
    
    return projectNameMatch || executionTypeMatch;
  });

  // Debug: Log TC Type Counts search results
  React.useEffect(() => {
    if (tcTypesSearchTerm.trim()) {
      console.log('TC Types Search Term:', tcTypesSearchTerm);
      console.log('Total TC Types:', allTCTypeCounts.length);
      console.log('Filtered Results:', filteredAllTcTypeCounts.length);
      console.log('Sample Data:', allTCTypeCounts.slice(0, 2));
    }
  }, [tcTypesSearchTerm, allTCTypeCounts.length, filteredAllTcTypeCounts.length]);

  const filteredAllAutomationData = allAutomationData.filter(automation => {
    if (!automationSearchTerm.trim()) return true;
    const searchLower = automationSearchTerm.toLowerCase();
    return automation.projectName.toLowerCase().includes(searchLower);
  });

  const PAGE_SIZE = 20;

  // Get paginated results from filtered data (works for both search and non-search)
  const displayedProjectUsers = filteredAllProjectUsers.slice(0, usersPage * PAGE_SIZE);
  const displayedProjectExecutions = filteredAllProjectExecutions.slice(0, executionsPage * PAGE_SIZE);
  const displayedSuiteExecutions = filteredAllSuiteExecutions.slice(0, suitesPage * PAGE_SIZE);
  const displayedTcTypeCounts = filteredAllTcTypeCounts.slice(0, tcTypesPage * PAGE_SIZE);
  const displayedAutomationData = filteredAllAutomationData.slice(0, automationPage * PAGE_SIZE);

  // Reset page to 1 when search term changes
  useEffect(() => { setUsersPage(1); }, [usersSearchTerm]);
  useEffect(() => { setExecutionsPage(1); }, [executionsSearchTerm]);
  useEffect(() => { setSuitesPage(1); }, [suitesSearchTerm]);
  useEffect(() => { setTcTypesPage(1); }, [tcTypesSearchTerm]);
  useEffect(() => { setAutomationPage(1); }, [automationSearchTerm]);

  if (isLoadingCustomer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-gray-500">Loading customer information...</p>
        </div>
      </div>
    );
  }

  if (!customerInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Customer not found</p>
          <Button onClick={() => navigate('/super-admin/customers')} className="mt-4">
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
                          <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin/customers')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{customerInfo.cust_name} - Analytics Report</h1>
                <p className="text-sm text-gray-600">Customer ID: {'CUST-'+customerInfo.id}</p>
              </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Projects Count Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900">
                  {customerInfo.projectCount ?? 0}
                </h3>
                <p className="text-gray-600 text-lg">Total Active Projects</p>
              </div>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="users" className="space-y-6" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="executions" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Executions
              </TabsTrigger>
              <TabsTrigger value="suites" className="flex items-center gap-2">
                <Layers3 className="w-4 h-4" />
                Suite Counts
              </TabsTrigger>
              <TabsTrigger value="tctypes" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                TC Types
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Automation
              </TabsTrigger>
            </TabsList>

            {/* Project Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Project Users & Last Login Details</h3>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search users by name, ID, or status..."
                        value={usersSearchTerm}
                        onChange={(e) => setUsersSearchTerm(e.target.value)}
                        className="w-72"
                      />
                      <Button
                        onClick={() => exportToExcel(filteredAllProjectUsers, `${customerInfo.cust_name}_project_users`, 'Project Users')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoadingUsers || filteredAllProjectUsers.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading project users...</span>
                    </div>
                  ) : displayedProjectUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {usersSearchTerm ? `No users found matching "${usersSearchTerm}"` : 'No project users found'}
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b">
                        <p className="text-sm text-blue-600">
                          Showing {displayedProjectUsers.length} of {filteredAllProjectUsers.length} records{usersSearchTerm && ' (filtered)'}
                        </p>
                      </div>
                      <div
                        className="overflow-auto"
                        style={{maxHeight: '512px'}}
                        onScroll={createScrollHandler(loadMoreUsers)}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  {/* <Hash className="w-4 h-4 text-gray-500" /> */}
                                  User Id
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  Username
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  Last Login
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-gray-500" />
                                  Status
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedProjectUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium break-words">{user.id}</TableCell>
                              <TableCell className="break-words">{user.username}</TableCell>
                              <TableCell>
                                {user.lastLogin && user.lastLogin !== "Never Logged In"
                                  ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')
                                  : 'Never Logged In'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    user.active == "Active"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-gray-100 text-gray-800 border-gray-200"
                                  }
                                >
                                  {user.active}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {usersPage * PAGE_SIZE >= filteredAllProjectUsers.length && allProjectUsers.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                All {filteredAllProjectUsers.length} records loaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  )}
                </CardContent>
              </div>
            </TabsContent>

            {/* Project Executions Tab */}
            <TabsContent value="executions" className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <CardHeader className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">Projects & Last Execution Details</CardTitle>
                    <Input
                      placeholder="Search by project name, exec code..."
                      value={executionsSearchTerm}
                      onChange={(e) => setExecutionsSearchTerm(e.target.value)}
                      className="w-72"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Start Date Picker */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(startDate, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-4">
                            <label className="text-sm font-medium block mb-2">Start Date</label>
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* End Date Picker */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(endDate, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-4">
                            <label className="text-sm font-medium block mb-2">End Date</label>
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={handleEndDateChange}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Load Data Button */}
                    <Button
                      onClick={loadProjectExecutions}
                      disabled={isLoadingExecutions || !!dateError}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoadingExecutions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Load Data
                        </>
                      )}
                    </Button>
                    {/* Export Button */}
                    <Button
                      onClick={() => exportToExcel(filteredAllProjectExecutions, `${customerInfo.cust_name}_project_executions`, 'Project Executions')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isLoadingExecutions || filteredAllProjectExecutions.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Date Error Display */}
                  {dateError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm font-medium">{dateError}</p>
                      <p className="text-red-500 text-xs mt-1">Please select valid dates to load data</p>
                    </div>
                  )}
                  
                  {isLoadingExecutions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading project executions...</span>
                    </div>
                  ) : displayedProjectExecutions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {executionsSearchTerm ? `No executions found matching "${executionsSearchTerm}"` : 
                       dateError ? 'Please fix date selection errors to load data' : 'No project executions found for the selected date range'}
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b">
                        <p className="text-sm text-blue-600">
                          Showing {displayedProjectExecutions.length} of {filteredAllProjectExecutions.length} records{executionsSearchTerm && ' (filtered)'}
                        </p>
                      </div>
                      <div
                        className="overflow-auto"
                        style={{maxHeight: '490px'}}
                        onScroll={createScrollHandler(loadMoreExecutions)}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  Project Name
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Code className="w-4 h-4 text-gray-500" />
                                  Execution Code
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-gray-500" />
                                  Execution Type Code
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  Last Execution Time
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedProjectExecutions.map((execution, index) => (
                            <TableRow key={`${execution.projectId}-${execution.execCode}-${index}`}>
                              <TableCell className="font-medium break-words">{execution.projectName}</TableCell>
                              <TableCell>{execution.execCode || '-'}</TableCell>
                              <TableCell>{execution.execTypeCode || '-'}</TableCell>
                              <TableCell>
                                {execution.lastExecutionTime
                                  ? format(new Date(execution.lastExecutionTime), 'MMM dd, yyyy HH:mm')
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          {executionsPage * PAGE_SIZE >= filteredAllProjectExecutions.length && allProjectExecutions.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                All {filteredAllProjectExecutions.length} records loaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  )}
                </CardContent>
              </div>
            </TabsContent>

            {/* Suite Execution Counts Tab */}
            <TabsContent value="suites" className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <CardHeader className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">Suite Execution Counts</CardTitle>
                    <Input
                      placeholder="Search by project name, suite code..."
                      value={suitesSearchTerm}
                      onChange={(e) => setSuitesSearchTerm(e.target.value)}
                      className="w-72"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Start Date Picker */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(startDate, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-4">
                            <label className="text-sm font-medium block mb-2">Start Date</label>
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* End Date Picker */}
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(endDate, 'MMM dd, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-4">
                            <label className="text-sm font-medium block mb-2">End Date</label>
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={handleEndDateChange}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Load Data Button */}
                    <Button
                      onClick={loadSuiteExecutions}
                      disabled={isLoadingSuites || !!dateError}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoadingSuites ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Load Data
                        </>
                      )}
                    </Button>
                    {/* Export Button */}
                    <Button
                      onClick={() => exportToExcel(filteredAllSuiteExecutions, `${customerInfo.cust_name}_suite_executions`, 'Suite Executions')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isLoadingSuites || filteredAllSuiteExecutions.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Date Error Display */}
                  {dateError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm font-medium">{dateError}</p>
                      <p className="text-red-500 text-xs mt-1">Please select valid dates to load data</p>
                    </div>
                  )}
                  
                  {isLoadingSuites ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading suite executions...</span>
                    </div>
                  ) : displayedSuiteExecutions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {suitesSearchTerm ? `No suite executions found matching "${suitesSearchTerm}"` : 
                       dateError ? 'Please fix date selection errors to load data' : 'No suite executions found for the selected date range'}
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b">
                        <p className="text-sm text-blue-600">
                          Showing {displayedSuiteExecutions.length} of {filteredAllSuiteExecutions.length} records{suitesSearchTerm && ' (filtered)'}
                        </p>
                      </div>
                      <div
                        className="overflow-auto"
                        style={{maxHeight: '490px'}}
                        onScroll={createScrollHandler(loadMoreSuites)}
                      >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                {/* <Hash className="w-4 h-4 text-gray-500" /> */}
                                Project ID
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                Project Name
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <TestTube className="w-4 h-4 text-gray-500" />
                                Suite Code
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-gray-500" />
                                Execution Count
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedSuiteExecutions.map((suite, index) => (
                            <TableRow key={`${suite.projectId}-${suite.suiteCode}-${index}`}>
                              <TableCell className="break-words">{'PR-'+suite.projectId}</TableCell>
                              <TableCell className="break-words">{suite.projectName}</TableCell>
                              <TableCell className="break-words">{suite.suiteCode || '-'}</TableCell>
                              <TableCell className="text-center">{suite.executionCount !== undefined ? suite.executionCount : 0}</TableCell>
                            </TableRow>
                          ))}
                          {suitesPage * PAGE_SIZE >= filteredAllSuiteExecutions.length && allSuiteExecutions.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                All {filteredAllSuiteExecutions.length} records loaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  )}
                </CardContent>
              </div>
            </TabsContent>

            {/* TC Type Counts Tab */}
            <TabsContent value="tctypes" className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <CardHeader className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">Project-wise Test Case Type Counts</CardTitle>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search by project name, execution type..."
                        value={tcTypesSearchTerm}
                        onChange={(e) => setTcTypesSearchTerm(e.target.value)}
                        className="w-72"
                      />
                      <Button
                        onClick={() => exportToExcel(filteredAllTcTypeCounts, `${customerInfo.cust_name}_tc_type_counts`, 'TC Type Counts')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoadingTCTypes || filteredAllTcTypeCounts.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingTCTypes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading test case type counts...</span>
                    </div>
                  ) : displayedTcTypeCounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {tcTypesSearchTerm ? `No TC types found matching "${tcTypesSearchTerm}"` : 'No test case type counts found'}
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b">
                        <p className="text-sm text-blue-600">
                          Showing {displayedTcTypeCounts.length} of {filteredAllTcTypeCounts.length} records{tcTypesSearchTerm && ' (filtered)'}
                        </p>
                      </div>
                      <div
                        className="overflow-auto"
                        style={{maxHeight: '490px'}}
                        onScroll={createScrollHandler(loadMoreTCTypes)}
                      >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                Project
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-gray-500" />
                                Execution Type
                              </div>
                            </TableHead>
                           
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                WEB
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-gray-500" />
                                ANDROID
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-gray-500" />
                                iOS
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-gray-500" />
                                API
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Laptop className="w-4 h-4 text-gray-500" />
                                DESKTOP
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-gray-500" />
                                MAINFRAME
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-500" />
                                SAP
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-gray-500" />
                                DATABASE
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-gray-500" />
                                Total
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedTcTypeCounts.map((tcType, index) => (
                            <TableRow key={`${tcType.projectId}-${tcType.executionType}-${index}`}>
                              <TableCell className="font-medium break-words">{tcType.projectName}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.executionType}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.WEB || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.ANDROID || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.IOS || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.API || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.DESKTOP || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.MAINFRAME || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.SAP || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.DATABASE || 0}</TableCell>
                              <TableCell className="text-center font-semibold">{tcType.totalTCs || 0}</TableCell>
                            </TableRow>
                          ))}
                          {tcTypesPage * PAGE_SIZE >= filteredAllTcTypeCounts.length && allTCTypeCounts.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center py-4 text-gray-500">
                                All {filteredAllTcTypeCounts.length} records loaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  )}
                </CardContent>
              </div>
            </TabsContent>

            {/* Automation Percentage Tab */}
            <TabsContent value="automation" className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border">
                <CardHeader className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-800">Project-wise Automation Percentage</CardTitle>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search by project name..."
                        value={automationSearchTerm}
                        onChange={(e) => setAutomationSearchTerm(e.target.value)}
                        className="w-72"
                      />
                      <Button
                        onClick={() => exportToExcel(filteredAllAutomationData, `${customerInfo.cust_name}_automation_data`, 'Automation Data')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoadingAutomation || filteredAllAutomationData.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAutomation ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading automation data...</span>
                    </div>
                  ) : displayedAutomationData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {automationSearchTerm ? `No automation data found matching "${automationSearchTerm}"` : 'No automation data found'}
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-blue-50 border-b">
                        <p className="text-sm text-blue-600">
                          Showing {displayedAutomationData.length} of {filteredAllAutomationData.length} records{automationSearchTerm && ' (filtered)'}
                        </p>
                      </div>
                      <div
                        className="overflow-auto"
                        style={{maxHeight: '490px'}}
                        onScroll={createScrollHandler(loadMoreAutomation)}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  Project Name
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <TestTube className="w-4 h-4 text-gray-500" />
                                  Total Test Cases
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-gray-500" />
                                  Automated Test Cases
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-2">
                                  <Percent className="w-4 h-4 text-gray-500" />
                                  Automation %
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayedAutomationData.map((automation) => (
                            <TableRow key={automation.projectId}>
                              <TableCell className="font-medium break-words">{automation.projectName}</TableCell>
                              <TableCell className="text-center">{automation.totalTCs}</TableCell>
                              <TableCell className="text-center">{automation.automatedTCs}</TableCell>
                              <TableCell className="text-center font-semibold">{automation.automationPercentage || 0}%</TableCell>
                            </TableRow>
                          ))}
                          {automationPage * PAGE_SIZE >= filteredAllAutomationData.length && allAutomationData.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                All {filteredAllAutomationData.length} records loaded
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  )}
                </CardContent>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;

