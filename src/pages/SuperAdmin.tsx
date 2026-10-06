import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Package, Menu, X, BarChart3 } from 'lucide-react';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Customers from './Customers';
import CustomerForm from './CustomerForm';
import CustomerReport from './CustomerReport';
import CustomerDashboard from './CustomerDashboard';
import PackageBuilder from './PackageBuilder';
import PackageForm from './PackageForm';
import CloudDeviceIntegration from './CloudDeviceIntegration';

const SuperAdmin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the system"
    });
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Close dropdown when route changes
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/super-admin',
      icon: BarChart3,
      current: location.pathname === '/super-admin'
    },
    {
      name: 'Customer Management',
      href: '/super-admin/customers',
      icon: Users,
      current: location.pathname.includes('/customers')
    },
    {
      name: 'Package Builder',
      href: '/super-admin/package-builder',
      icon: Package,
      current: location.pathname.includes('/package-builder')
    },
    // {
    //   name: 'Cloud Device Integration',
    //   href: '/super-admin/cloud-device-integration',
    //   icon: Database,
    //   current: location.pathname.includes('/cloud-device-integration')
    // }
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <header className="bg-primary text-primary-foreground shadow-sm border-b border-border flex-shrink-0 z-40">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 lg:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-primary-foreground hover:bg-primary-foreground/20 p-2"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center border border-primary-foreground/30">
                <span className="text-primary-foreground font-bold text-sm lg:text-lg">S</span>
              </div>
              <div className="hidden sm:block">
                <img
                  src="/simplifylogo.svg"
                  alt="SimplifyQA Logo"
                  className="h-6 lg:h-7 w-auto"
                  style={{ width: '120px' }}
                />
                <p className="text-xs lg:text-sm text-primary-foreground/90 font-medium">License Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Dropdown */}
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <aside className={`${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } translate-x-0 transition-all duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-30 w-64 lg:w-72 bg-card shadow-sm lg:shadow-sm border-r border-border flex-shrink-0`}
        style={{ transform:"unset !important" }}>
          <nav className="p-4 lg:p-6 space-y-2 mt-16 lg:mt-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "default" : "ghost"}
                className={`w-full justify-start gap-3 px-4 py-3 text-sm lg:text-base font-medium transition-colors ${
                  item.current 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-card-foreground hover:bg-muted hover:text-card-foreground'
                }`}
                onClick={() => {
                  navigate(item.href);
                  setIsSidebarOpen(false);
                }}
              >
                <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.current ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                {item.name}
              </Button>
            ))}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 border-t border-border" style={{
               position:"absolute",
               left:0,
               background:"#fff",
               width:"285px"
          }}>
            <div className="text-center">
              <p className="text-xs text-card-foreground font-medium">SimplifyQA</p>
              <p className="text-xs text-muted-foreground">v2.0.0</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<CustomerDashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/create" element={<CustomerForm />} />
            <Route path="/customers/view/:id" element={<CustomerForm isView />} />
            <Route path="/customers/edit/:id" element={<CustomerForm />} />
            <Route path="/customers/:id/report" element={<CustomerReport />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            <Route path="/package-builder" element={<PackageBuilder />} />
            <Route path="/package-builder/create" element={<PackageForm />} />
            <Route path="/package-builder/view/:id" element={<PackageForm isView />} />
            <Route path="/package-builder/edit/:id" element={<PackageForm />} />
            <Route path="/cloud-device-integration" element={<CloudDeviceIntegration />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/25 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SuperAdmin;