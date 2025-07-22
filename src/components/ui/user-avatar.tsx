'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/client-auth';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

import { getUserInitials } from '@/lib/client-auth';

// Remove the local getInitials function and use the imported one

export function UserAvatar({ 
  user, 
  size = 'md', 
  className, 
  showFallback = true 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const photoUrl = `/api/photos/${encodeURIComponent(user.employee_code)}`;
  const initials = getUserInitials(user.full_name);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!imageError && (
        <AvatarImage
          src={photoUrl}
          alt={`${user.full_name} profile photo`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="object-cover"
        />
      )}
      {showFallback && (
        <AvatarFallback 
          className={cn(
            "bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium",
            {
              'bg-gradient-to-br from-purple-500 to-purple-600': user.role === 'admin',
              'bg-gradient-to-br from-green-500 to-green-600': user.role === 'manager',
              'bg-gradient-to-br from-blue-500 to-blue-600': user.role === 'employee',
            }
          )}
        >
          {isLoading ? (
            <div className="animate-pulse bg-gray-300 rounded-full w-full h-full" />
          ) : (
            initials
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

// Higher-order component for employee photos in lists
interface EmployeePhotoProps {
  employeeCode: string;
  fullName: string;
  role?: 'admin' | 'manager' | 'employee';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function EmployeePhoto({ 
  employeeCode, 
  fullName, 
  role = 'employee',
  size = 'md', 
  className 
}: EmployeePhotoProps) {
  return (
    <UserAvatar 
      user={{
        id: 0,
        employee_code: employeeCode,
        full_name: fullName,
        role,
        email: '',
        department: '',
        designation: '',
        status: 'active',
        must_change_password: false,
      }}
      size={size}
      className={className}
    />
  );
}

// Profile photo component with upload capability (for admin use)
interface ProfilePhotoProps extends UserAvatarProps {
  editable?: boolean;
  onPhotoChange?: (file: File) => void;
}

export function ProfilePhoto({ 
  user, 
  size = 'xl', 
  className, 
  editable = false, 
  onPhotoChange 
}: ProfilePhotoProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onPhotoChange) {
      onPhotoChange(file);
    }
  };

  return (
    <div className="relative group">
      <UserAvatar user={user} size={size} className={className} />
      
      {editable && (
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
          <label className="cursor-pointer text-white text-xs font-medium">
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}