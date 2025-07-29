-- Add submitter_message column to applications table
-- This separates the original submitter's message from reviewer's feedback

-- Add the submitter_message column
ALTER TABLE applications 
ADD COLUMN submitter_message TEXT;

-- Add a comment to document the distinction
COMMENT ON COLUMN applications.submitter_message IS 'Original message from submitter when submitting for review';
COMMENT ON COLUMN applications.review_comments IS 'Reviewer feedback after review completion';