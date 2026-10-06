import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [step, setStep] = useState<'email' | 'password'>('email');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, verifyEmail, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login component - isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
    
    if (isAuthenticated && !authLoading) {
      const from = location.state?.from?.pathname || '/super-admin';
      console.log('User already authenticated, redirecting to:', from);
      
      // Use setTimeout to prevent navigation conflicts
      const timeoutId = setTimeout(() => {
        try {
          navigate(from, { replace: true });
        } catch (error) {
          console.error('Navigation error in Login:', error);
          // Fallback navigation
          window.location.href = from;
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  // Reset form when coming from session expiration
  useEffect(() => {
    console.log('Login component mounted, location state:', location.state);
    // If coming from session expiration, reset form state
    if (location.state?.sessionExpired) {
      setStep('email');
      setIsEmailVerified(false);
      setEmail('');
      setPassword('');
      setErrors({});
    }
  }, [location.state]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (currentStep: 'email' | 'password') => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (currentStep === 'password' && !password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm('email')) return;
    
    setIsLoading(true);
    try {
      const success = await verifyEmail(email);
      
      if (success) {
        setIsEmailVerified(true);
        setStep('password');
        toast({
          title: "Email verified successfully",
          description: "Please enter your password to continue",
        });
      } else {
        toast({
          title: "Verification failed",
          description: "Please check your email and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm('password')) return;
    
    setIsLoading(true);
    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome to License Management System"
        });
        const from = location.state?.from?.pathname || '/super-admin';
        console.log('Login successful, redirecting to:', from);
        
        // Use setTimeout to allow state updates to complete before navigation
        setTimeout(() => {
          try {
            navigate(from, { replace: true });
          } catch (error) {
            console.error('Login navigation error:', error);
            // Fallback navigation
            window.location.href = from;
          }
        }, 100); // Small delay to ensure auth state is updated
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleBackToEmail = () => {
    setIsEmailVerified(false);
    setPassword('');
    setErrors({});
    setStep('email');
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            SIMPLIFYQA
          </h1>
          <p className="text-gray-600 font-medium">License Management System</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/80 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {step === 'email' ? 'Welcome Back' : 'Enter Password'}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {step === 'email' 
                ? 'Sign in to your account to continue' 
                : `Signing in as ${email}`
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                step === 'email' ? 'bg-primary scale-110' : 'bg-gray-300'
              }`}></div>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                step === 'password' ? 'bg-primary scale-110' : 'bg-gray-300'
              }`}></div>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleEmailVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="Enter your email address"
                      className={`pl-10 h-12 border-2 transition-all duration-200 ${
                        errors.email 
                          ? 'border-destructive focus:border-destructive' 
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center space-x-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{email}</span>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="Enter your password"
                      className={`pl-10 pr-12 h-12 border-2 transition-all duration-200 ${
                        errors.password 
                          ? 'border-destructive focus:border-destructive' 
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center space-x-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  onClick={handleBackToEmail}
                >
                  ← Use different email
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Secure access to your license management dashboard
          </p>
          <p className="text-xs text-primary font-medium mt-2">
            Demo mode · any email and password will work
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;