-- Add revision tracking to applications table
-- This allows tracking multiple review rounds for the same application

-- Add revision_number column to applications table
ALTER TABLE applications 
ADD COLUMN revision_number INTEGER DEFAULT 1 NOT NULL;

-- Add comment for the new column
COMMENT ON COLUMN applications.revision_number IS 'Tracks the revision number for resubmissions after rejections';

-- Create index for better performance when querying by revision number
CREATE INDEX idx_applications_revision_number ON applications(revision_number);

-- Update existing applications to have revision_number = 1
UPDATE applications SET revision_number = 1 WHERE revision_number IS NULL;