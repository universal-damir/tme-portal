'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<LoginInput>({
    employeeCode: '',
    password: '',
    rememberMe: false,
  });

  // Get error from URL params
  const urlError = searchParams?.get('error');
  
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'account_inactive':
        return 'Your account has been deactivated. Please contact your administrator.';
      case 'session_error':
        return 'Your session has expired. Please sign in again.';
      case 'access_denied':
        return 'Access denied. You do not have permission to access that resource.';
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate form data
      const validatedData = loginSchema.parse(formData);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user needs to change password
        if (data.user?.must_change_password) {
          router.push('/change-password');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        setError(err.errors[0].message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginInput, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - TME Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-12 w-12 text-white" />
              <div>
                <h1 className="text-3xl font-bold">TME Portal</h1>
                <p className="text-blue-200">TME Services Management System</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 leading-relaxed">
              Your comprehensive business services platform for cost calculations, 
              company setup, and administrative management.
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Cost Overview & Quote Generation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Company Services Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Golden Visa Applications</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Tax Consultation & Filing</span>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-700">
            <p className="text-sm text-blue-300">
              © 2024 TME Services. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 lg:hidden">
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <h1 className="text-xl font-bold text-gray-900">TME Portal</h1>
                    <p className="text-sm text-gray-600">Management System</p>
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-2xl text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your employee credentials to access the portal
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* URL Error Message */}
              {urlError && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {getErrorMessage(urlError)}
                  </AlertDescription>
                </Alert>
              )}

              {/* Form Error Message */}
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode" className="text-sm font-medium text-gray-700">
                    Employee Code
                  </Label>
                  <Input
                    id="employeeCode"
                    type="text"
                    placeholder="Enter your employee code"
                    value={formData.employeeCode}
                    onChange={(e) => handleInputChange('employeeCode', e.target.value.toUpperCase())}
                    disabled={isLoading}
                    className="uppercase"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange('rememberMe', !!checked)}
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm text-gray-600 font-normal"
                  >
                    Keep me signed in for 30 days
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Having trouble signing in? Contact your system administrator at{' '}
                  <a href="mailto:uwe@TME-Services.com" className="text-blue-600 hover:text-blue-700">
                    uwe@TME-Services.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              This is a secure system. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}