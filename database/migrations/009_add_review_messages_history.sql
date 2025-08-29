-- Add Review Messages History Table
-- Store conversation history between submitters and reviewers
-- Safe migration - only adds new table, doesn't modify existing ones

-- Review Messages table - Store all messages in the review conversation
CREATE TABLE review_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('submitter', 'reviewer')),
    message TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'comment' CHECK (message_type IN ('comment', 'submission', 'approval', 'rejection', 'revision')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_review_messages_application_id ON review_messages(application_id);
CREATE INDEX idx_review_messages_user_id ON review_messages(user_id);
CREATE INDEX idx_review_messages_created_at ON review_messages(created_at);

-- Add comments to document the table structure
COMMENT ON TABLE review_messages IS 'Stores conversation history between submitters and reviewers';
COMMENT ON COLUMN review_messages.user_role IS 'Role of user when message was sent: submitter or reviewer';
COMMENT ON COLUMN review_messages.message_type IS 'Type of message: comment, submission, approval, rejection, revision';