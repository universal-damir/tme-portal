-- Migration 018: Email Follow-up System
-- Creates tables and structures for tracking email follow-ups with automatic escalation
-- Author: TME Portal Team
-- Date: 2025-01-12

-- Create email_follow_ups table
CREATE TABLE IF NOT EXISTS email_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email details
    email_subject VARCHAR(500) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    document_type VARCHAR(100),
    original_email_id VARCHAR(255), -- Reference to email service provider ID
    
    -- Follow-up tracking
    follow_up_number INTEGER NOT NULL DEFAULT 1 CHECK (follow_up_number BETWEEN 1 AND 3),
    sent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status management
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'no_response', 'snoozed')),
    completed_date TIMESTAMP WITH TIME ZONE,
    completed_reason VARCHAR(50) CHECK (completed_reason IN ('client_responded', 'signed', 'paid', 'cancelled', 'other')),
    
    -- Manager escalation
    escalated_to_manager BOOLEAN DEFAULT FALSE,
    escalation_date TIMESTAMP WITH TIME ZONE,
    manager_id INTEGER REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT unique_active_follow_up UNIQUE (user_id, original_email_id, follow_up_number)
);

-- Create indexes for efficient querying
CREATE INDEX idx_follow_ups_user_status ON email_follow_ups(user_id, status);
CREATE INDEX idx_follow_ups_due_date ON email_follow_ups(due_date) WHERE status = 'pending';
CREATE INDEX idx_follow_ups_sent_date ON email_follow_ups(sent_date);
CREATE INDEX idx_follow_ups_client ON email_follow_ups(client_name, client_email);

-- Create follow-up history table for audit trail
CREATE TABLE IF NOT EXISTS email_follow_up_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follow_up_id UUID NOT NULL REFERENCES email_follow_ups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'created', 'completed', 'snoozed', 'escalated', 
        'marked_no_response', 'resent', 'updated'
    )),
    
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for history queries
CREATE INDEX idx_follow_up_history_follow_up ON email_follow_up_history(follow_up_id);
CREATE INDEX idx_follow_up_history_user ON email_follow_up_history(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_follow_up_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER update_email_follow_ups_timestamp
    BEFORE UPDATE ON email_follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_up_timestamp();

-- Function to auto-escalate overdue follow-ups
CREATE OR REPLACE FUNCTION escalate_overdue_follow_ups()
RETURNS void AS $$
DECLARE
    follow_up_record RECORD;
BEGIN
    -- Find all 3rd follow-ups that are overdue by 1+ days
    FOR follow_up_record IN 
        SELECT ef.*, u.role, u.full_name
        FROM email_follow_ups ef
        JOIN users u ON ef.user_id = u.id
        WHERE ef.status = 'pending'
        AND ef.follow_up_number = 3
        AND ef.due_date < CURRENT_TIMESTAMP - INTERVAL '1 day'
        AND ef.escalated_to_manager = FALSE
    LOOP
        -- Update to no_response status
        UPDATE email_follow_ups
        SET status = 'no_response',
            escalated_to_manager = CASE 
                WHEN follow_up_record.role != 'manager' THEN TRUE 
                ELSE FALSE 
            END,
            escalation_date = CURRENT_TIMESTAMP
        WHERE id = follow_up_record.id;
        
        -- Log the action
        INSERT INTO email_follow_up_history (
            follow_up_id, user_id, action, 
            previous_status, new_status, 
            notes
        ) VALUES (
            follow_up_record.id, 
            follow_up_record.user_id, 
            'marked_no_response',
            'pending', 
            'no_response',
            'Auto-escalated after 3rd follow-up expired'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add column to users table for manager designation (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'is_manager') THEN
        ALTER TABLE users ADD COLUMN is_manager BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_follow_ups TO authenticated;
GRANT SELECT, INSERT ON email_follow_up_history TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE email_follow_ups IS 'Tracks email follow-ups with automatic escalation after 3 attempts';
COMMENT ON TABLE email_follow_up_history IS 'Audit trail for all follow-up actions';
COMMENT ON COLUMN email_follow_ups.follow_up_number IS '1=Day 7, 2=Day 14, 3=Day 21';
COMMENT ON COLUMN email_follow_ups.status IS 'pending=active, completed=done, no_response=after 3 attempts, snoozed=delayed';