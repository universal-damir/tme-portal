/**
 * Approval Service
 * Handles approval workflow logic and manager assignment
 */

import { query } from '@/lib/database';

export class ApprovalService {
  /**
   * Get the manager ID for approval based on user's role hierarchy
   * For now, this is a simplified implementation
   * TODO: Integrate with proper role/permission system
   */
  static async getManagerForApproval(userId: number): Promise<number> {
    try {
      // For now, assign to admin user or a specific manager ID
      // In production, this should check the user's department and hierarchy
      const result = await query(
        `SELECT id FROM users 
         WHERE role = 'admin' OR role = 'manager' 
         ORDER BY created_at ASC 
         LIMIT 1`,
        []
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Fallback: assign to self if no manager found
      return userId;
    } catch (error) {
      console.error('Error getting manager for approval:', error);
      return userId; // Fallback to self
    }
  }

  /**
   * Check if user has approval permissions
   * TODO: Integrate with proper permission system
   */
  static async canApproveInvoices(userId: number): Promise<boolean> {
    try {
      const result = await query(
        `SELECT role FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        const role = result.rows[0].role;
        return role === 'admin' || role === 'manager';
      }

      return false;
    } catch (error) {
      console.error('Error checking approval permissions:', error);
      return false;
    }
  }

  /**
   * Get approval statistics for the current user
   */
  static async getApprovalStats(userId: number): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
         FROM invoice_approvals 
         WHERE assigned_to = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        return {
          pending: parseInt(result.rows[0].pending) || 0,
          approved: parseInt(result.rows[0].approved) || 0,
          rejected: parseInt(result.rows[0].rejected) || 0,
        };
      }

      return { pending: 0, approved: 0, rejected: 0 };
    } catch (error) {
      console.error('Error getting approval stats:', error);
      return { pending: 0, approved: 0, rejected: 0 };
    }
  }
}