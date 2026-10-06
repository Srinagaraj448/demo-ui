import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Filter, Download, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface Package {
  id: string;
  name: string;
  description: string;
}

const PackageBuilder = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, []);

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

  const filteredPackages = packages.filter(
    pkg =>
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Package Builder</h1>
              <p className="text-sm text-gray-600 mt-1">Manage license packages and permissions</p>
            </div>
             
            <Button 
              onClick={() => navigate('/super-admin/package-builder/create')}
              className="px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Package
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Packages
              </h2>
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Badge variant="secondary" className="flex-shrink-0">
                {searchQuery ? `${filteredPackages.length} of ${packages.length}` : `${packages.length} Total`}
              </Badge>
            </div>
          </div>
          
          {/* Package Grid */}
          <div className="p-6 overflow-y-auto" style={{height: '745px'}}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading packages...</p>
                </div>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No packages found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/super-admin/package-builder/view/${pkg.id}`)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          title="View Package"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/super-admin/package-builder/edit/${pkg.id}`)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          title="Edit Package"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                      {pkg.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {pkg.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-gray-600 border-gray-200">
                        ID: {pkg.id}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/super-admin/package-builder/view/${pkg.id}`)}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PackageBuilder;