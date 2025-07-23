import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional().default(false),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const userProfileSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be 255 characters or less'),
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must be 100 characters or less'),
  designation: z.string()
    .min(1, 'Designation is required')
    .max(255, 'Designation must be 255 characters or less'),
});

export const adminUserSchema = z.object({
  employee_code: z.string()
    .min(1, 'Employee code is required')
    .max(10, 'Employee code must be 10 characters or less')
    .regex(/^[A-Z0-9\s]+$/, 'Employee code must contain only uppercase letters, numbers, and spaces'),
  email: z.string()
    .email('Invalid email address'),
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be 255 characters or less'),
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department must be 100 characters or less'),
  designation: z.string()
    .min(1, 'Designation is required')
    .max(255, 'Designation must be 255 characters or less'),
  role: z.enum(['admin', 'manager', 'employee']),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('active'),
  must_change_password: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;