import { User } from '@/lib/auth';
import { query } from '@/lib/database';

export type Permission = {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
};

export type UserRole = 'admin' | 'manager' | 'employee';
export type ResourceType = 'cost_overview' | 'company_services' | 'golden_visa' | 'taxation' | 'users' | 'system' | 'audit';
export type ActionType = 'read' | 'write' | 'export' | 'admin' | 'delete';

// Default role permissions
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'cost_overview_read', 'cost_overview_write', 'cost_overview_export',
    'company_services_read', 'company_services_write', 'company_services_export',
    'golden_visa_read', 'golden_visa_write', 'golden_visa_export',
    'taxation_read', 'taxation_write', 'taxation_export',
    'user_management', 'system_admin', 'audit_logs'
  ],
  manager: [
    'cost_overview_read', 'cost_overview_write', 'cost_overview_export',
    'company_services_read', 'company_services_write', 'company_services_export',
    'golden_visa_read', 'golden_visa_write', 'golden_visa_export',
    'taxation_read', 'taxation_write', 'taxation_export'
  ],
  employee: [
    'cost_overview_read', 'cost_overview_write', 'cost_overview_export',
    'company_services_read', 'company_services_write', 'company_services_export',
    'golden_visa_read', 'golden_visa_write', 'golden_visa_export',
    'taxation_read', 'taxation_write', 'taxation_export'
  ]
};

// Get user permissions from database
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  try {
    const result = await query(`
      SELECT p.* FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
    `, [userId]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

// Check if user has specific permission
export async function hasPermission(
  user: User, 
  resource: ResourceType, 
  action: ActionType
): Promise<boolean> {
  try {
    const permissionName = `${resource}_${action}`;
    
    // Check role-based permissions first
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role];
    if (rolePermissions.includes(permissionName)) {
      return true;
    }

    // Check explicit user permissions
    const userPermissions = await getUserPermissions(user.id);
    return userPermissions.some(p => p.name === permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Check if user can access specific resource
export async function canAccessResource(
  user: User,
  resource: ResourceType,
  action: ActionType = 'read'
): Promise<boolean> {
  // Admin can access everything
  if (user.role === 'admin') {
    return true;
  }

  // Check account status
  if (user.status !== 'active') {
    return false;
  }

  return hasPermission(user, resource, action);
}

// Grant permission to user
export async function grantPermission(
  userId: number,
  permissionName: string,
  grantedBy: number
): Promise<boolean> {
  try {
    // Check if permission exists
    const permissionResult = await query(
      'SELECT id FROM permissions WHERE name = $1',
      [permissionName]
    );

    if (permissionResult.rows.length === 0) {
      throw new Error(`Permission '${permissionName}' does not exist`);
    }

    const permissionId = permissionResult.rows[0].id;

    // Grant permission
    await query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, permission_id) DO NOTHING
    `, [userId, permissionId, grantedBy]);

    return true;
  } catch (error) {
    console.error('Error granting permission:', error);
    return false;
  }
}

// Revoke permission from user
export async function revokePermission(userId: number, permissionName: string): Promise<boolean> {
  try {
    await query(`
      DELETE FROM user_permissions 
      WHERE user_id = $1 
      AND permission_id = (SELECT id FROM permissions WHERE name = $2)
    `, [userId, permissionName]);

    return true;
  } catch (error) {
    console.error('Error revoking permission:', error);
    return false;
  }
}

// Department-based access control
export function canAccessDepartmentData(user: User, targetDepartment: string): boolean {
  // Admin and managers can access all departments
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  // Employees can only access their own department
  return user.department === targetDepartment;
}

// Higher-order function to create permission-based middleware
export function requirePermission(resource: ResourceType, action: ActionType = 'read') {
  return async (user: User): Promise<boolean> => {
    return canAccessResource(user, resource, action);
  };
}

// Check multiple permissions
export async function hasAnyPermission(
  user: User,
  permissions: Array<{ resource: ResourceType; action: ActionType }>
): Promise<boolean> {
  for (const { resource, action } of permissions) {
    if (await hasPermission(user, resource, action)) {
      return true;
    }
  }
  return false;
}

// Check all permissions
export async function hasAllPermissions(
  user: User,
  permissions: Array<{ resource: ResourceType; action: ActionType }>
): Promise<boolean> {
  for (const { resource, action } of permissions) {
    if (!(await hasPermission(user, resource, action))) {
      return false;
    }
  }
  return true;
}