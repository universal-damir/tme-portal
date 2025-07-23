'use client'

import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/lib/auth'

// Department-specific feature access rules
const DEPARTMENT_ACCESS: Record<string, string[]> = {
  'IT': ['system_admin', 'user_management', 'all_departments'],
  'Management': ['all_departments', 'audit_access', 'manager_reports'],
  'Finance': ['taxation', 'company_services', 'golden_visa'],
  'Legal': ['golden_visa', 'corporate_changes', 'company_services'],
  'Business Development': ['cost_overview', 'company_services', 'golden_visa'],
  'Administration': ['company_services', 'corporate_changes'],
  'HR': ['user_management', 'company_services'],
}

// Role-based permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'admin': ['all_permissions'],
  'manager': ['department_management', 'team_reports', 'export_data'],
  'employee': ['basic_access'],
}

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Admin has all permissions
    if (user.role === 'admin') return true

    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || []
    if (rolePermissions.includes('all_permissions') || rolePermissions.includes(permission)) {
      return true
    }

    // Check department-specific permissions
    const departmentPermissions = DEPARTMENT_ACCESS[user.department] || []
    return departmentPermissions.includes(permission) || departmentPermissions.includes('all_departments')
  }

  const hasDepartmentAccess = (department: string): boolean => {
    if (!user) return false

    // Admin and Management can access all departments
    if (user.role === 'admin' || user.department === 'Management') return true

    // IT department can access all departments
    if (user.department === 'IT') return true

    // Users can access their own department
    return user.department === department
  }

  const canAccessFeature = (feature: string): boolean => {
    if (!user) return false

    const featurePermissions: Record<string, string[]> = {
      'profile': ['IT', 'Management', 'Business Development', 'Finance', 'Legal', 'Administration', 'HR'],
      'cost_overview': ['IT', 'Management', 'Business Development', 'Finance'],
      'golden_visa': ['IT', 'Management', 'Legal', 'Business Development', 'Finance'],
      'company_services': ['IT', 'Management', 'Finance', 'Legal', 'Administration', 'HR'],
      'corporate_changes': ['IT', 'Management', 'Legal', 'Administration'],
      'taxation': ['IT', 'Management', 'Finance'],
      'user_management': ['IT', 'HR'],
      'system_admin': ['IT'],
      'audit_logs': ['IT', 'Management'],
    }

    const allowedDepartments = featurePermissions[feature] || []
    
    // Admin always has access
    if (user.role === 'admin') return true

    // Check department access
    return allowedDepartments.includes(user.department)
  }

  const getAccessibleDepartments = (): string[] => {
    if (!user) return []

    // Admin and Management can see all departments
    if (user.role === 'admin' || user.department === 'Management') {
      return Object.keys(DEPARTMENT_ACCESS)
    }

    // IT can see all departments
    if (user.department === 'IT') {
      return Object.keys(DEPARTMENT_ACCESS)
    }

    // Regular users can only see their own department
    return [user.department]
  }

  const canExportData = (): boolean => {
    if (!user) return false
    return user.role === 'admin' || user.role === 'manager' || user.department === 'Management'
  }

  const canViewReports = (): boolean => {
    if (!user) return false
    return user.role === 'admin' || user.role === 'manager' || ['Management', 'Finance', 'IT'].includes(user.department)
  }

  return {
    hasPermission,
    hasDepartmentAccess,
    canAccessFeature,
    getAccessibleDepartments,
    canExportData,
    canViewReports,
    user,
  }
}