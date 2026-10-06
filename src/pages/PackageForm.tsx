import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit3, Save, X, CheckCircle, Package, Settings, Zap, Shield, Globe, Database, Smartphone, Monitor, Tablet, Eye, EyeOff, ChevronRight, Star, TrendingUp, Users, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { privileges_config } from "../config/all_privileges.json"

interface PackageFormProps {
  isView?: boolean;
}

interface SubModule {
  id: string;
  name: string;
  enabled: boolean;
}

interface ModulePermission {
  id: string;
  name: string;
  enabled: boolean;
  licenseTypes?: SubModule[];
  icon?: React.ReactNode;
  description?: string;
  category?: string;
}

interface PackageData {
  name: string;
  description: string;
  modules?: ModulePermission[];
  privileges?: any[];
  licenseType?: any[];
}

const PACKAGE_CONFIG: ModulePermission[] = [
  { 
    id: 'project-release-management', 
    name: 'PROJECT & RELEASE MANAGEMENT', 
    enabled: true,
    icon: <Package className="w-4 h-4" />,
    description: 'Manage projects and releases efficiently',
    category: 'Core'
  },
  { 
    id: 'impact-analysis', 
    name: 'IMPACT ANALYSIS', 
    enabled: true,
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Analyze impact of changes across systems',
    category: 'Analytics'
  },
  { 
    id: 'requirement-management', 
    name: 'REQUIREMENT MANAGEMENT', 
    enabled: true,
    icon: <Settings className="w-4 h-4" />,
    description: 'Track and manage requirements lifecycle',
    category: 'Core'
  },
  { 
    id: 'defect-management', 
    name: 'DEFECT MANAGEMENT', 
    enabled: true,
    icon: <Shield className="w-4 h-4" />,
    description: 'Track, manage and resolve defects',
    category: 'Quality'
  },
  { 
    id: 'test-management', 
    name: 'TEST MANAGEMENT', 
    enabled: true,
    icon: <Zap className="w-4 h-4" />,
    description: 'Comprehensive test planning and execution',
    category: 'Testing',
    licenseTypes : [
      { id: 'web', name: 'WEB', enabled: true },
      { id: 'android', name: 'ANDROID', enabled: false },
      { id: 'ios', name: 'IOS', enabled: false },
      { id: 'api', name: 'API', enabled: false },
      { id: 'db', name: 'DATABASE', enabled: false },
      { id: 'mainframe', name: 'MAINFRAME', enabled: false },
      { id: 'desktop', name: 'DESKTOP', enabled: false }
    ]
  },
  { 
    id: 'test-execution', 
    name: 'TEST EXECUTION', 
    enabled: true,
    icon: <Activity className="w-4 h-4" />,
    description: 'Execute and monitor test scenarios',
    category: 'Testing'
  },
  { 
    id: 'workflow-builder', 
    name: 'WORKFLOW BUILDER', 
    enabled: true,
    icon: <Settings className="w-4 h-4" />,
    description: 'Create custom workflows and processes',
    category: 'Automation'
  },
  { 
    id: 'rtm', 
    name: 'RTM', 
    enabled: true,
    icon: <Globe className="w-4 h-4" />,
    description: 'Requirements traceability matrix',
    category: 'Analytics'
  },
  { 
    id: 'reports-dashboard', 
    name: 'REPORTS & DASHBOARD', 
    enabled: true,
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Advanced reporting and analytics',
    category: 'Analytics'
  },
  { 
    id: 'configuration', 
    name: 'CONFIGURATION', 
    enabled: true,
    icon: <Settings className="w-4 h-4" />,
    description: 'System configuration and customization',
    category: 'Administration'
  },
  { 
    id: 'market-place', 
    name: 'MARKETPLACE', 
    enabled: true,
    icon: <Globe className="w-4 h-4" />,
    description: 'Access to marketplace and integrations',
    category: 'Integrations'
  },
  { 
    id: 'miscellaneous', 
    name: 'MISCELLANEOUS', 
    enabled: true,
    icon: <Star className="w-4 h-4" />,
    description: 'Additional features and utilities',
    category: 'Utilities'
  }
];

const PackageForm = ({ isView: initialIsView = false }: PackageFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PackageData>>({});
  const [isView, setIsView] = useState(initialIsView);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [existingPackageNames, setExistingPackageNames] = useState<string[]>([]);
  const [originalName, setOriginalName] = useState('');
  
  const [formData, setFormData] = useState<PackageData>({
    name: '',
    description: '',
    modules: PACKAGE_CONFIG.map(module => ({
      ...module,
      enabled: !id, // Enable all modules for new packages, disabled for existing
      licenseTypes: module.licenseTypes?.map(sub => ({ 
        ...sub, 
        enabled: !id && sub.id === 'web' // For new packages, enable only 'web' in test management
      }))
    }))
  });

  const isEditMode = Boolean(id) && !isView;
  const isCreateMode = !id && !isView;

  // Calculate form completion percentage
  const formCompletionPercentage = () => {
    let completed = 0;
    let total = 3;
    
    if (formData.name.trim()) completed++;
    if (formData.description.trim()) completed++;
    if (formData.modules.some(m => m.enabled)) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Load all package names for duplicate check
  useEffect(() => {
    const loadPackageNames = async () => {
      try {
        const response = await apiService.getAllPackages();
        if (response.success && response.data) {
          setExistingPackageNames(response.data.map((p: any) => p.name?.toLowerCase()).filter(Boolean));
        }
      } catch (e) { /* ignore */ }
    };
    loadPackageNames();
  }, []);

  // Load package data when editing or viewing
  useEffect(() => {
    if (id && (isEditMode || isView)) {
      loadPackageData();
    }
  }, [id, isEditMode, isView]);

  // Debug effect to monitor form data changes
  useEffect(() => {
    console.log('Form Data Updated:', formData);
    console.log('Modules enabled count:', formData.modules.filter(m => m.enabled).length);
  }, [formData]);

  const loadPackageData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getPackageById(id);
      
      if (response.success && response.data) {
        const packageData = response.data;
        
        console.log('Package Data from API:', packageData);
        
        const mappedModules = PACKAGE_CONFIG.map(module => {
          let isEnabled = false;
          
          if (packageData.privileges && Array.isArray(packageData.privileges)) {
            isEnabled = packageData.privileges.some((privilege: any) => {
              return privilege.groupName === module.name;
            });
          }
          
          let licenseTypes = module.licenseTypes;
          if (licenseTypes && Array.isArray(licenseTypes)) {
            licenseTypes = licenseTypes.map(sub => {
              let subEnabled = false;
              
              if (module.id === 'test-management' && Array.isArray(packageData.licenseType)) {
                subEnabled = packageData.licenseType.includes(sub.id);
              }
              
              return {
                ...sub,
                enabled: subEnabled
              };
            });
          }
          
          return {
            ...module,
            enabled: isEnabled,
            licenseTypes
          };
        });
        
        const pkgName = packageData.name || packageData.packageName || '';
        setOriginalName(pkgName.toLowerCase());
        setFormData({
          name: pkgName,
          description: packageData.description || '',
          modules: mappedModules
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load package data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading package data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading package data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PackageData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    } else if (
      existingPackageNames.includes(formData.name.trim().toLowerCase()) &&
      formData.name.trim().toLowerCase() !== originalName
    ) {
      newErrors.name = 'A package with this name already exists';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.modules.some(module => module.enabled)) {
      toast({
        title: "Validation Error",
        description: "Please enable at least one module",
        variant: "destructive"
      });
      
      // Scroll to module configuration section
      setTimeout(() => {
        const moduleSection = document.querySelector('[data-section="module-configuration"]');
        if (moduleSection) {
          moduleSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      return false;
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to the first error element
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0];
        const errorElement = document.getElementById(firstErrorField) || 
                           document.querySelector(`[data-field="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          errorElement.focus();
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isView) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let response;
      const privileges: string[] = [];
      formData.modules.forEach(module => {
        if (module.enabled) {
          const group = privileges_config[module.name];
          privileges.push(group);
        }
      });

      let licenseType: string[] = [];
      const testManagementModule = formData.modules.find(m => m.id === 'test-management');
      if (testManagementModule && testManagementModule.licenseTypes) {
        licenseType = [];
        for (const sub of testManagementModule.licenseTypes) {
          if (sub.enabled) licenseType.push(sub.id);
        }
      }
      
      // Create submit data without mutating original formData
      const submitData = {
        name: formData.name,
        description: formData.description,
        privileges,
        licenseType
      };
      
      console.log('Submitting package data:', submitData);
      
      if (isCreateMode) {
        response = await apiService.createPackage(submitData);
      } else {
        response = await apiService.updatePackage(id!, submitData);
      }

      console.log('API Response:', response);

      if (response.success) {
        setIsLoading(false);
        toast({
          title: isCreateMode ? "Package created successfully" : "Package updated successfully",
          description: `Package ${formData.name} has been ${isCreateMode ? 'created' : 'updated'}`
        });
        navigate('/super-admin/package-builder');
      } else {
        setIsLoading(false);
        toast({
          title: "Operation failed",
          description: response.error || "Failed to save package",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Package submission error:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof Omit<PackageData, 'modules'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(module => {
        if (module.id === moduleId) {
          const newEnabled = !module.enabled;
          console.log(`Toggling module ${moduleId} to ${newEnabled}`);
          
          // Handle test-management module special cases
          if (moduleId === 'test-management' && module.licenseTypes) {
            if (newEnabled) {
              // If enabling test-management, enable web platform by default
              console.log('Auto-enabling web platform for test-management');
              return {
                ...module,
                enabled: newEnabled,
                licenseTypes: module.licenseTypes.map(sub =>
                  sub.id === 'web' ? { ...sub, enabled: true } : {...sub, enabled: false}
                )
              };
            } else {
              // If disabling test-management, disable all license types
              console.log('Disabling all platforms for test-management');
              return {
                ...module,
                enabled: newEnabled,
                licenseTypes: module.licenseTypes.map(sub => ({ ...sub, enabled: false }))
              };
            }
          }
          return { ...module, enabled: newEnabled };
        }
        return module;
      })
    }));
  };

  const handleSubModuleToggle = (moduleId: string, subModuleId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(module =>
        module.id === moduleId 
          ? {
              ...module,
              licenseTypes: module.licenseTypes?.map(sub =>
                sub.id === subModuleId ? { ...sub, enabled: !sub.enabled } : sub
              )
            }
          : module
      )
    }));
  };

  const handleEditClick = () => {
    setShowEditConfirm(true);
  };

  const confirmEdit = () => {
    setIsView(false);
    setShowEditConfirm(false);
  };

  const getTitle = () => {
    if (isView) return 'View Package';
    if (isEditMode) return 'Edit Package';
    return 'Create New Package';
  };

  if (isLoading && (isEditMode || isView)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin/package-builder')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Packages
              </Button>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getTitle()}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isView 
                    ? 'Review package configuration and privileges'
                    : isEditMode 
                      ? 'Modify package settings and permissions'
                      : 'Design a comprehensive license package'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isView && !isCreateMode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Completion:</span>
                  <Progress value={formCompletionPercentage()} className="w-20 h-2" />
                  <span className="text-xs font-medium text-gray-700">{formCompletionPercentage()}%</span>
                </div>
              )}
              
              {isView && (
                <AlertDialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button onClick={handleEditClick} size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Package
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Enable Edit Mode?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will allow you to modify the package details and privileges. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmEdit}>Enable Edit</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto" style={{height: 'calc(100vh - 140px)'}}>
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Package Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Package Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Package Name *
                </Label>
                <Input
                  id="name"
                  data-field="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter package name..."
                  disabled={isView || isLoading}
                  className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Input
                  id="description"
                  data-field="description"
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the package features and benefits..."
                  disabled={isView || isLoading}
                  className={`mt-1 ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Module Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6" data-section="module-configuration">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Module Configuration
                </h2>
                <p className="text-sm text-gray-600 mt-1">Select and configure package modules and features</p>
              </div>
              
              {!isView && (
                <div className="flex items-center gap-2">
                  {/* <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAdvanced ? 'Simple' : 'Advanced'}
                  </Button> */}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        modules: prev.modules.map(m => ({ 
                          ...m, 
                          enabled: true,
                          licenseTypes: m.licenseTypes?.map(sub => ({ ...sub, enabled: true }))
                        }))
                      }));
                    }}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Enable All
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        modules: prev.modules.map(m => ({ 
                          ...m, 
                          enabled: false,
                          licenseTypes: m.licenseTypes?.map(sub => ({ ...sub, enabled: false }))
                        }))
                      }));
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Disable All
                  </Button>
                </div>
              )}
            </div>
            
            {/* All Modules in One Card */}
            <div className="space-y-4">
              {formData.modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        module.enabled 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {module.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{module.name}</h4>
                        {
                          <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                        }
                      </div>
                    </div>
                    
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => !isView && handleModuleToggle(module.id)}
                      disabled={isView}
                    />
                  </div>

                  {/* Test Management Platforms */}
                  {module.id === 'test-management' && module.licenseTypes && module.enabled && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" />
                        Testing Platforms
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {module.licenseTypes.map((subModule) => (
                          <div key={subModule.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <Switch
                              checked={subModule.enabled}
                              onCheckedChange={() => !isView && handleSubModuleToggle(module.id, subModule.id)}
                              disabled={isView || !module.enabled}
                            />
                            <div className="flex items-center gap-2">
                              {subModule.id === 'web' && <Globe className="w-3 h-3 text-blue-500" />}
                              {subModule.id === 'android' && <Smartphone className="w-3 h-3 text-green-500" />}
                              {subModule.id === 'ios' && <Smartphone className="w-3 h-3 text-gray-500" />}
                              {subModule.id === 'api' && <Settings className="w-3 h-3 text-purple-500" />}
                              {subModule.id === 'db' && <Database className="w-3 h-3 text-blue-600" />}
                              {subModule.id === 'mainframe' && <Monitor className="w-3 h-3 text-gray-600" />}
                              <Label className="text-xs font-medium text-gray-700">
                                {subModule.name}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Package Summary */}
          <div className="bg-gray-50 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Package Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Enabled Modules ({formData.modules.filter(m => m.enabled).length})</h3>
                <div className="space-y-2">
                  {formData.modules.filter(m => m.enabled).map(module => (
                    <div key={module.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{module.name}</span>
                    </div>
                  ))}
                  {formData.modules.filter(m => m.enabled).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-4 text-center">No modules enabled</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Test Management Platforms</h3>
                <div className="space-y-2">
                  {(() => {
                    const testManagementModule = formData.modules.find(m => m.id === 'test-management');
                    
                    // If test-management module is disabled, show appropriate message
                    if (!testManagementModule?.enabled) {
                      return (
                        <p className="text-sm text-gray-500 italic p-4 text-center">
                          Test Management module is disabled
                        </p>
                      );
                    }
                    
                    // If test-management is enabled, show platforms
                    const enabledPlatforms = testManagementModule.licenseTypes?.filter(sub => sub.enabled);
                    
                    if (!enabledPlatforms || enabledPlatforms.length === 0) {
                      return (
                        <p className="text-sm text-gray-500 italic p-4 text-center">
                          No platforms selected
                        </p>
                      );
                    }
                    
                    return enabledPlatforms.map(subModule => (
                      <div key={subModule.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{subModule.name}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isView && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button
                type="submit"
                className="px-8 py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isCreateMode ? 'Creating Package...' : 'Updating Package...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isCreateMode ? 'Create Package' : 'Save Changes'}
                  </div>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/super-admin/package-builder')}
                className="px-8 py-2"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PackageForm;