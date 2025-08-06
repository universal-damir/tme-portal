/**
 * Follow-up Processing Cron Job
 * Processes 7-day client follow-up reminders
 * Phase 4: Smart Automation Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationTodoAutomation } from '@/lib/services/notification-todo-automation';
import { TodoService } from '@/lib/services/todo-service';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (check for cron secret or internal call)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting follow-up processing cron job...');

    // Step 1: Process overdue follow-ups
    await NotificationTodoAutomation.cleanupExpiredTodos();

    // Step 2: Create urgent reminders for clients who haven't been contacted
    const results = await createOverdueClientReminders();

    // Step 3: Generate 7-day follow-up todos for recent document sends
    const followUpResults = await generateFollowUpTodos();

    console.log(`✅ Follow-up processing completed:`, {
      urgent_reminders: results.urgent_reminders_created,
      new_followups: followUpResults.follow_ups_created,
      clients_affected: [...new Set([...results.clients_contacted, ...followUpResults.clients_scheduled])]
    });

    return NextResponse.json({
      success: true,
      results: {
        urgent_reminders_created: results.urgent_reminders_created,
        clients_contacted: results.clients_contacted,
        follow_ups_created: followUpResults.follow_ups_created,
        clients_scheduled: followUpResults.clients_scheduled,
        total_clients_affected: [...new Set([...results.clients_contacted, ...followUpResults.clients_scheduled])].length
      }
    });

  } catch (error) {
    console.error('❌ Follow-up processing cron job failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cron job failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * Create urgent reminders for overdue client contacts
 */
async function createOverdueClientReminders(): Promise<{
  urgent_reminders_created: number;
  clients_contacted: string[];
}> {
  try {
    // Get follow-up todos that are overdue by more than 24 hours
    const { todos: overdueTodos } = await TodoService.getByUser({
      status: ['pending'],
      category: ['follow_up'],
      overdue_only: true,
      limit: 100
    });

    const clientsContacted: string[] = [];
    let urgentRemindersCreated = 0;

    for (const todo of overdueTodos) {
      if (!todo.due_date) continue;

      const hoursOverdue = (Date.now() - new Date(todo.due_date).getTime()) / (1000 * 60 * 60);
      
      // Only create urgent reminders for todos overdue by more than 24 hours
      if (hoursOverdue > 24) {
        const urgentTodo = await TodoService.create({
          user_id: todo.user_id,
          title: `URGENT: Follow up with ${todo.client_name || 'client'}`,
          description: `Follow-up is ${Math.ceil(hoursOverdue)} hours overdue. Original task: "${todo.title}"`,
          category: 'reminder',
          priority: 'urgent',
          due_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          client_name: todo.client_name,
          document_type: todo.document_type,
          application_id: todo.application_id,
          metadata: {
            auto_generated: true,
            urgent_reminder: true,
            original_todo_id: todo.id,
            hours_overdue: Math.ceil(hoursOverdue)
          }
        });

        // Mark original todo as expired
        await TodoService.updateStatus(todo.id, 'expired');

        urgentRemindersCreated++;
        if (todo.client_name) {
          clientsContacted.push(todo.client_name);
        }

        console.log(`⚠️  Created urgent reminder for ${todo.client_name} (${Math.ceil(hoursOverdue)}h overdue)`);
      }
    }

    return {
      urgent_reminders_created: urgentRemindersCreated,
      clients_contacted: [...new Set(clientsContacted)]
    };

  } catch (error) {
    console.error('Failed to create overdue client reminders:', error);
    return { urgent_reminders_created: 0, clients_contacted: [] };
  }
}

/**
 * Generate 7-day follow-up todos for recent document sends
 */
async function generateFollowUpTodos(): Promise<{
  follow_ups_created: number;
  clients_scheduled: string[];
}> {
  try {
    // Get recent PDF sending activities (from 7 days ago, with 1-hour tolerance)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
    const sevenDaysAgoPlus1Hour = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Find PDF sending activities from 7 days ago that don't have follow-up todos
    const query = `
      WITH recent_sends AS (
        SELECT DISTINCT
          al.user_id,
          al.details->>'client_name' as client_name,
          al.details->>'document_type' as document_type,
          al.details->>'filename' as filename,
          al.created_at
        FROM audit_logs al
        WHERE al.action = 'pdf_sent'
          AND al.created_at BETWEEN $1 AND $2
          AND al.details->>'client_name' IS NOT NULL
      ),
      existing_followups AS (
        SELECT DISTINCT
          ut.user_id,
          ut.client_name
        FROM user_todos ut
        WHERE ut.category = 'follow_up'
          AND ut.client_name IS NOT NULL
          AND ut.created_at >= $1 - INTERVAL '1 day'
      )
      SELECT rs.*
      FROM recent_sends rs
      LEFT JOIN existing_followups ef ON rs.user_id = ef.user_id AND rs.client_name = ef.client_name
      WHERE ef.user_id IS NULL
      ORDER BY rs.created_at DESC
    `;

    const result = await pool.query(query, [sevenDaysAgo, sevenDaysAgoPlus1Hour]);
    await pool.end();

    const clientsScheduled: string[] = [];
    let followUpsCreated = 0;

    for (const row of result.rows) {
      const followUpTodo = await TodoService.create({
        user_id: row.user_id,
        title: `Follow up with ${row.client_name}`,
        description: `Check if client has responded to ${row.document_type || row.filename || 'document'} sent 7 days ago.`,
        category: 'follow_up',
        priority: 'medium',
        due_date: new Date(), // Due now (7 days after sending)
        client_name: row.client_name,
        document_type: row.document_type,
        metadata: {
          auto_generated: true,
          follow_up_type: '7_day_client_contact',
          document_sent_date: row.created_at,
          filename: row.filename
        }
      });

      followUpsCreated++;
      clientsScheduled.push(row.client_name);

      // Log the follow-up creation
      await logAuditEvent(
        row.user_id,
        'follow_up_todo_created',
        'automation',
        {
          client_name: row.client_name,
          document_type: row.document_type,
          original_send_date: row.created_at,
          todo_id: followUpTodo.id
        }
      );

      console.log(`📅 Created 7-day follow-up for ${row.client_name} (document: ${row.document_type || row.filename})`);
    }

    return {
      follow_ups_created: followUpsCreated,
      clients_scheduled: [...new Set(clientsScheduled)]
    };

  } catch (error) {
    console.error('Failed to generate follow-up todos:', error);
    return { follow_ups_created: 0, clients_scheduled: [] };
  }
}

// Only allow GET requests (for cron jobs)
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for cron job endpoints.' },
    { status: 405 }
  );
}