import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Edit3, Save, X, User, Mail, Package, BarChart3, Trash2, Calendar, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { CUSTOMER_STATUS_OPTIONS } from '@/config/environment';

interface CustomerFormProps {
  isView?: boolean;
}

interface PackageSelection {
  packageId: number;
  start_date: string;
  end_date: string;
  noOfLicense: number;
}

interface CustomerData {
  cust_name: string;
  companyName: string;
  customerStatus: string;
  adminEmail: string;
  packageList: PackageSelection[];
}

interface PackageFieldErrors {
  start_date?: string;
  end_date?: string;
  noOfLicense?: string;
}

interface CustomerFormErrors {
  cust_name?: string;
  companyName?: string;
  customerStatus?: string;
  adminEmail?: string;
  packageList?: string;
  packages?: { [index: number]: PackageFieldErrors };
}

const CustomerForm = ({ isView: initialIsView = false }: CustomerFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isView, setIsView] = useState(initialIsView);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [packages, setPackages] = useState<Array<{id: number; name: string; description: string; licenseType?: string[]}>>([]);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [existingCompanyNames, setExistingCompanyNames] = useState<string[]>([]);
  const [existingCustNames, setExistingCustNames] = useState<string[]>([]);
  const [originalCompanyName, setOriginalCompanyName] = useState('');
  const [originalCustName, setOriginalCustName] = useState('');

  const [formData, setFormData] = useState<CustomerData>({
    cust_name: '',
    companyName: '',
    customerStatus: 'active',
    adminEmail: '',
    packageList: []
  });

  const isEditMode = Boolean(id) && !isView;
  const isCreateMode = !id && !isView;

  // Packages not yet selected — available for the dropdown
  const availablePackages = packages.filter(
    pkg => pkg.id != null && !formData.packageList.some(sel => Number(sel.packageId) === Number(pkg.id))
  );

  // Derived: highest licenseCount across all packages
  const computedLicenseCount = formData.packageList.length > 0
    ? Math.max(...formData.packageList.map(p => Number(p.noOfLicense) || 0))
    : 0;

  // Derived: earliest start_date across all packages (first package's start_date)
  const computedStartDate = formData.packageList.length > 0
    ? formData.packageList.reduce((min, p) => {
        if (!p.start_date) return min;
        return !min || p.start_date < min ? p.start_date : min;
      }, '' as string)
    : '';

  // Derived: highest end_date across all packages
  const computedEndDate = formData.packageList.length > 0
    ? formData.packageList.reduce((max, p) => {
        if (!p.end_date) return max;
        return !max || p.end_date > max ? p.end_date : max;
      }, '' as string)
    : '';

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ── Data Loading ──────────────────────────────────────────────────

  useEffect(() => {
    loadPackages();
    loadExistingCustomerNames();
  }, []);

  const loadExistingCustomerNames = async () => {
    try {
      const response = await apiService.getAllCustomers();
      if (response.success && response.data) {
        const customers = Array.isArray(response.data) ? response.data : [];
        setExistingCompanyNames(customers.map((c: any) => c.companyName?.toLowerCase()).filter(Boolean));
        setExistingCustNames(customers.map((c: any) => c.cust_name?.toLowerCase()).filter(Boolean));
      }
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    if (packages.length > 0 && id && (isEditMode || isView) && !isLoadingCustomer) {
      loadCustomerData();
    }
  }, [packages, id, isEditMode, isView]);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAllPackages();
      if (response.success && response.data) {
        setPackages(response.data);
      } else {
        toast({
          title: "Error loading packages",
          description: response.error || "Failed to load package data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading packages",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const loadCustomerData = async () => {
    if (!id) return;

    setIsLoadingCustomer(true);
    try {
      const response = await apiService.getCustomerById(id);

      if (response.success && response.data) {
        const customer = response.data;

        // Build packageList from the API response
        let packageSelections: PackageSelection[] = [];

        if (customer.packageList && customer.packageList.length > 0) {
          packageSelections = customer.packageList.map((pkg: any) => {
            let start_date = '';
            if (pkg.start_date) {
              start_date = new Date(pkg.start_date).toISOString().split('T')[0];
            } else if (pkg.start_date || pkg.packagestart_date) {
              start_date = new Date(pkg.start_date || pkg.packagestart_date).toISOString().split('T')[0];
            }

            let end_date = '';
            if (pkg.end_date) {
              end_date = new Date(pkg.end_date).toISOString().split('T')[0];
            } else if (pkg.duration && start_date) {
              const start = new Date(start_date);
              start.setDate(start.getDate() + parseInt(pkg.duration));
              end_date = start.toISOString().split('T')[0];
            }

            return {
              packageId: pkg.packageId || pkg.id,
              start_date,
              end_date,
              noOfLicense: pkg.noOfLicense || pkg.licenseCount || 1
            };
          });
        } else if (customer.packageId) {
          // Fallback: use flat fields from the customer object
          packageSelections = [{
            packageId: customer.packageId,
            start_date: customer.start_date
              ? new Date(customer.start_date).toISOString().split('T')[0]
              : getTodayDate(),
            end_date: customer.end_date
              ? new Date(customer.end_date).toISOString().split('T')[0]
              : '',
            noOfLicense: customer.licenseCount || 1
          }];
        }

        setOriginalCompanyName((customer.companyName || '').toLowerCase());
        setOriginalCustName((customer.cust_name || '').toLowerCase());
        setFormData({
          cust_name: customer.cust_name || '',
          companyName: customer.companyName || '',
          customerStatus: customer.customerStatus?.toLowerCase() || 'active',
          adminEmail: customer.adminEmail || '',
          packageList: packageSelections
        });
      } else {
        toast({ title: "Error", description: "Failed to load customer data", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred while loading customer data", variant: "destructive" });
    }
    setIsLoadingCustomer(false);
  };

  // ── Package Handlers ──────────────────────────────────────────────

  const addPackage = (packageId: number) => {
    setFormData(prev => ({
      ...prev,
      packageList: [
        ...prev.packageList,
        { packageId, start_date: getTodayDate(), end_date: '', noOfLicense: 1 }
      ]
    }));
    if (errors.packageList) {
      setErrors(prev => ({ ...prev, packageList: undefined }));
    }
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packageList: prev.packageList.filter((_, i) => i !== index)
    }));
    // Re-index package errors
    if (errors.packages) {
      const newPkgErrors: { [i: number]: PackageFieldErrors } = {};
      Object.entries(errors.packages).forEach(([key, val]) => {
        const k = parseInt(key);
        if (k < index) newPkgErrors[k] = val;
        else if (k > index) newPkgErrors[k - 1] = val;
      });
      setErrors(prev => ({ ...prev, packages: Object.keys(newPkgErrors).length > 0 ? newPkgErrors : undefined }));
    }
  };

  const updatePackageField = (index: number, field: keyof PackageSelection, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      packageList: prev.packageList.map((pkg, i) => {
        if (i !== index) return pkg;
        const updated = { ...pkg, [field]: value };
        // Auto-clear end date if start date moves past it
        if (field === 'start_date' && updated.end_date) {
          const start = new Date(value as string);
          const end = new Date(updated.end_date);
          if (end <= start) updated.end_date = '';
        }
        return updated;
      })
    }));
    // Clear the specific field error
    if (errors.packages?.[index]?.[field as keyof PackageFieldErrors]) {
      setErrors(prev => ({
        ...prev,
        packages: {
          ...prev.packages,
          [index]: { ...prev.packages?.[index], [field]: undefined }
        }
      }));
    }
  };

  // ── Basic Field Handler ───────────────────────────────────────────

  const handleInputChange = (field: 'cust_name' | 'companyName' | 'customerStatus' | 'adminEmail', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof CustomerFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    if (!formData.cust_name.trim()) {
      newErrors.cust_name = 'Customer name is required';
    } else if (formData.cust_name.trim().length < 3) {
      newErrors.cust_name = 'Customer name must be at least 3 characters';
    } else if (
      existingCustNames.includes(formData.cust_name.trim().toLowerCase()) &&
      formData.cust_name.trim().toLowerCase() !== originalCustName
    ) {
      newErrors.cust_name = 'A customer with this name already exists';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.trim().length < 3) {
      newErrors.companyName = 'Company name must be at least 3 characters';
    } else if (
      existingCompanyNames.includes(formData.companyName.trim().toLowerCase()) &&
      formData.companyName.trim().toLowerCase() !== originalCompanyName
    ) {
      newErrors.companyName = 'A customer with this company name already exists';
    }

    if (!id && !isView) {
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Admin email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'Please enter a valid email address';
      }
    }

    // Package validation
    if (formData.packageList.length === 0) {
      newErrors.packageList = 'At least one package is required';
    } else {
      const pkgErrors: { [index: number]: PackageFieldErrors } = {};

      formData.packageList.forEach((pkg, index) => {
        const fieldErrors: PackageFieldErrors = {};

        if (!pkg.start_date) {
          fieldErrors.start_date = 'Start date is required';
        }

        if (!pkg.end_date) {
          fieldErrors.end_date = 'End date is required';
        } else {
          const endDate = new Date(pkg.end_date);
          endDate.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          if (pkg.start_date && endDate <= new Date(pkg.start_date)) {
            fieldErrors.end_date = 'End date must be after start date';
          } else if (endDate < todayDate) {
            fieldErrors.end_date = 'End date cannot be less than current date';
          }
        }

        if (!pkg.noOfLicense || pkg.noOfLicense < 1) {
          fieldErrors.noOfLicense = 'License count must be at least 1';
        }

        if (Object.keys(fieldErrors).length > 0) {
          pkgErrors[index] = fieldErrors;
        }
      });

      if (Object.keys(pkgErrors).length > 0) {
        newErrors.packages = pkgErrors;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const el = document.querySelector('.text-red-500');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let response;

      const packageList = formData.packageList.map(pkg => ({
        packageId: pkg.packageId,
        start_date: pkg.start_date,
        end_date: pkg.end_date,
        noOfLicense: pkg.noOfLicense
      }));

      // licenseType from the package with the highest noOfLicense
      const maxPkg = formData.packageList.reduce((max, p) => (Number(p.noOfLicense) || 0) > (Number(max.noOfLicense) || 0) ? p : max, formData.packageList[0]);
      const maxPkgInfo = packages.find(p => Number(p.id) === Number(maxPkg?.packageId));
      const licenseType = maxPkgInfo?.licenseType || [];

      const startDate = computedStartDate ? new Date(computedStartDate).toISOString() : undefined;
      const endDate = computedEndDate ? new Date(computedEndDate).toISOString() : undefined;

      if (isCreateMode) {
        response = await apiService.createCustomer({
          cust_name: formData.cust_name,
          companyName: formData.companyName,
          customerStatus: formData.customerStatus,
          adminEmail: formData.adminEmail,
          packageList,
          licenseCount: computedLicenseCount,
          licenseType,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          createdBy: apiService.loggedInUserId
        });
      } else {
        response = await apiService.updateCustomer(id!, {
          cust_name: formData.cust_name,
          companyName: formData.companyName,
          customerStatus: formData.customerStatus,
          packageList,
          licenseCount: computedLicenseCount,
          licenseType,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
      }

      if (response.success) {
        toast({
          title: isCreateMode ? "Customer created successfully" : "Customer updated successfully",
          description: `Customer ${formData.cust_name} has been ${isCreateMode ? 'created' : 'updated'}`
        });
        if (isCreateMode) {
          const customerId = response.data?.customerDetails?.id || response.data?.id;
          if (customerId) {
            setIsView(true);
            setShowEditConfirm(false);
            navigate(`/super-admin/customers/view/${customerId}`, { replace: true });
          }
        } else {
          // Edit mode: stay on same page, switch to view mode
          setIsView(true);
          setShowEditConfirm(false);
          navigate(`/super-admin/customers/view/${id}`, { replace: true });
        }
      } else {
        toast({ title: "Operation failed", description: response.error || "Failed to save customer", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────

  const handleEditClick = () => setShowEditConfirm(true);
  const confirmEdit = () => { setIsView(false); setShowEditConfirm(false); };

  const getTitle = () => {
    if (isView) return 'View Customer License';
    if (isEditMode) return 'Edit Customer License';
    return 'Create New License';
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getTitle()}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isView
                    ? 'View comprehensive customer license information'
                    : isEditMode
                      ? 'Update customer license and subscription details'
                      : 'Create a new customer license with full configuration'
                  }
                </p>
              </div>
            </div>

            {isView && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(`/super-admin/customers/${id}/report`)}
                  variant="outline"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Report
                </Button>
                <AlertDialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button onClick={handleEditClick} size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Customer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Enable Edit Mode?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will allow you to modify the customer license details. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmEdit}>Enable Edit</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoadingCustomer && (isEditMode || isView) ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customer information...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ─── Customer Information ─────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    data-field="cust_name"
                    value={formData.cust_name}
                    onChange={(e) => handleInputChange('cust_name', e.target.value)}
                    placeholder="Enter full customer name"
                    disabled={isView}
                    className={`mt-1 ${errors.cust_name ? 'border-red-500' : ''}`}
                  />
                  {errors.cust_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.cust_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    data-field="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company or organization name"
                    disabled={isView}
                    className={`mt-1 ${errors.companyName ? 'border-red-500' : ''}`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerStatus" className="text-sm font-medium text-gray-700">
                    Customer Status
                  </Label>
                  <Select
                    value={formData.customerStatus}
                    onValueChange={(value) => handleInputChange('customerStatus', value)}
                    disabled={isView}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ─── Package Selection (multi-select) ────────────── */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Selection
              </h2>

              {/* Add-package dropdown */}
              {!isView && (
                <div className="mb-5">
                  <Label className="text-sm font-medium text-gray-700">Add Package *</Label>
                  <Popover open={packageDropdownOpen} onOpenChange={setPackageDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={packageDropdownOpen}
                        className={`mt-1 w-full justify-between font-normal ${errors.packageList ? 'border-red-500' : ''}`}
                      >
                        Select a package to add...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search packages..." />
                        <CommandList>
                          <CommandEmpty>No packages found.</CommandEmpty>
                          <CommandGroup>
                            {availablePackages.map(pkg => (
                              <CommandItem
                                key={pkg.id}
                                value={pkg.name}
                                onSelect={() => {
                                  addPackage(pkg.id);
                                  setPackageDropdownOpen(false);
                                }}
                              >
                                {pkg.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.packageList && (
                    <p className="text-xs text-red-500 mt-1">{errors.packageList}</p>
                  )}
                </div>
              )}

              {/* Selected packages list */}
              {formData.packageList.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No packages selected yet.</p>
                  {!isView && (
                    <p className="text-xs text-gray-400 mt-1">Use the dropdown above to add packages.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.packageList.map((pkg, index) => {
                    const packageInfo = packages.find(p => Number(p.id) === Number(pkg.packageId));
                    const pkgErrors = errors.packages?.[index];

                    return (
                      <div key={`pkg-${pkg.packageId}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                        {/* Package header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">
                                {packageInfo?.name || `Package #${pkg.packageId}`}
                              </span>
                              {packageInfo?.description && (
                                <p className="text-xs text-gray-500">{packageInfo.description}</p>
                              )}
                            </div>
                          </div>
                          {!isView && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePackage(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              title="Remove package"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Per-package fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              License Start Date *
                            </Label>
                            <Input
                              type="date"
                              value={pkg.start_date}
                              onChange={(e) => updatePackageField(index, 'start_date', e.target.value)}
                              disabled={isView || isCreateMode || isEditMode}
                              className={`mt-1 ${pkgErrors?.start_date ? 'border-red-500' : ''}`}
                            />
                            {pkgErrors?.start_date && (
                              <p className="text-xs text-red-500 mt-1">{pkgErrors.start_date}</p>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              License End Date *
                            </Label>
                            <Input
                              type="date"
                              value={pkg.end_date}
                              onChange={(e) => updatePackageField(index, 'end_date', e.target.value)}
                              disabled={isView}
                              min={getTodayDate()}
                              className={`mt-1 ${pkgErrors?.end_date ? 'border-red-500' : ''}`}
                            />
                            {pkgErrors?.end_date && (
                              <p className="text-xs text-red-500 mt-1">{pkgErrors.end_date}</p>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Number of Licenses *
                            </Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              min="1"
                              value={pkg.noOfLicense || ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                updatePackageField(index, 'noOfLicense', raw === '' ? 0 : parseInt(raw));
                              }}
                              disabled={isView}
                              className={`mt-1 ${pkgErrors?.noOfLicense ? 'border-red-500' : ''}`}
                            />
                            {pkgErrors?.noOfLicense && (
                              <p className="text-xs text-red-500 mt-1">{pkgErrors.noOfLicense}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="secondary">
                      {formData.packageList.length} package{formData.packageList.length !== 1 ? 's' : ''} selected
                    </Badge>
                    {computedLicenseCount > 0 && (
                      <Badge variant="outline">
                        License Count: {computedLicenseCount}
                      </Badge>
                    )}
                    {computedEndDate && (
                      <Badge variant="outline">
                        End Date: {computedEndDate}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Admin Contact ────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Administrator Contact
              </h2>

              <div className="max-w-md">
                <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">
                  Administrator Email Address *
                </Label>
                <Input
                  id="adminEmail"
                  data-field="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  placeholder="Enter primary admin email address"
                  disabled={!isCreateMode}
                  className={`mt-1 ${errors.adminEmail ? 'border-red-500' : ''}`}
                />
                {errors.adminEmail && (
                  <p className="text-xs text-red-500 mt-1">{errors.adminEmail}</p>
                )}
                {!isCreateMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Admin email cannot be modified after creation
                  </p>
                )}
              </div>
            </div>

            {/* ─── Action Buttons ───────────────────────────────── */}
            {!isView && (
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
                <Button
                  type="submit"
                  className="px-8 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isCreateMode ? 'Creating License...' : 'Updating License...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {isCreateMode ? 'Create Customer License' : 'Save Changes'}
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/super-admin/customers')}
                  className="px-8 py-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;