import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Filter, Download, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface Customer {
  id: string;
  companyName: string;
  cust_name: string;
  duration: number;
  adminEmail: string;
  startDate: string;
  endDate: string;
  customerStatus: string;
  packageList: any[];
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filteredCount, setFilteredCount] = useState(0);
  const recordsPerPage = 20;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAllCustomers();
      
      if (response.success && response.data) {
        const data = response.data;
        for(let i of data){
         if(!i.startDate && i.packageList?.length > 0 && (i.packageList[0].start_date || i.packageList[0].packageStartDate)){
            i.startDate = new Date(i.packageList[0].start_date || i.packageList[0].packageStartDate).toISOString().split('T')[0];
          }
          if(i.duration){ 
            if (i.startDate) {
              const start = new Date(i.startDate);
              start.setDate(start.getDate() + parseInt(i.duration));
              i.endDate = start.toISOString().split('T')[0];
            } else {
              i.endDate = '';
            }
          }
        }
        setCustomers(data);
      } else {
        toast({
          title: "Error loading customers",
          description: response.error || "Failed to load customer data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading customers",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Update displayed customers when search query or customers change
  useEffect(() => {
    const filtered = customers.filter(
      customer =>
        (customer.id.toString() || '').includes(searchQuery.toLowerCase()) ||
        (customer.companyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (customer.cust_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (customer.adminEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
    
    setDisplayedCustomers(filtered.slice(0, recordsPerPage));
    setFilteredCount(filtered.length);
    setCurrentPage(1);
    setHasMore(filtered.length > recordsPerPage);
  }, [customers, searchQuery, recordsPerPage]);

  const loadMoreCustomers = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    
    const filtered = customers.filter(
      customer =>
        (customer.companyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (customer.cust_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (customer.adminEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
    
    const newCustomers = filtered.slice(startIndex, endIndex);
    setDisplayedCustomers(prev => [...prev, ...newCustomers]);
    setCurrentPage(nextPage);
    setHasMore(endIndex < filtered.length);
    
    setIsLoadingMore(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !isLoadingMore) {
      loadMoreCustomers();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'trial':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage customer licenses and subscriptions</p>
            </div>
            
            <Button 
              onClick={() => navigate('/super-admin/customers/create')}
              className="px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border">
          {/* Table Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Licenses
              </h2>
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Badge variant="secondary" className="flex-shrink-0">
                {searchQuery ? `${filteredCount} of ${customers.length}` : `${customers.length} Total`}
              </Badge>
            </div>
          </div>
          
          {/* Table Container */}
          <div 
            className="overflow-auto"
            onScroll={handleScroll}
            style={{ maxHeight: 'calc(100vh - 300px)' }}
          >
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Admin Email</th>
                  {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">End Date</th> */}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-gray-500">Loading customers...</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No customers found</p>
                          <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((customer) => (
                    <tr key={customer.id+'-'+customer.companyName} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm">
                        <span className="font-mono text-gray-900 font-medium">CUST-{customer.id}</span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {customer.cust_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-700">
                          {customer.companyName || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-700">
                          {customer.adminEmail || '-'}
                        </div>
                      </td>
                      {/* <td className="px-4 py-4 text-sm">
                        <div className="text-gray-700">
                          {customer.startDate ? new Date(customer.startDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-700">
                          {customer.endDate ? new Date(customer.endDate).toLocaleDateString() : '-'}
                        </div>
                      </td> */}
                      <td className="px-4 py-4 text-sm">
                        <Badge variant={getStatusBadgeVariant(customer.customerStatus)}>
                          {customer.customerStatus || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/super-admin/customers/view/${customer.id}`)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            title="View Customer Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/super-admin/customers/edit/${customer.id}`)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/super-admin/customers/${customer.id}/report`)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            title="View Customer Report"
                          >
                            <BarChart3 className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Loading indicator for scroll-to-load */}
            {hasMore && displayedCustomers.length > 0 && (
              <div className="text-center py-4 border-t border-gray-100">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more customers...</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    onClick={loadMoreCustomers}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Load More Customers
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;