-- Update Urgency Levels Migration
-- Changes urgency levels from 'low'/'medium'/'high' to 'standard'/'urgent'

-- Drop the old constraint first
ALTER TABLE applications DROP CONSTRAINT applications_urgency_check;

-- Update any existing data to use the new values
UPDATE applications 
SET urgency = CASE 
    WHEN urgency = 'low' THEN 'standard'
    WHEN urgency = 'medium' THEN 'standard' 
    WHEN urgency = 'high' THEN 'urgent'
    ELSE 'standard'
END;

-- Add the new constraint with updated values
ALTER TABLE applications ADD CONSTRAINT applications_urgency_check 
CHECK (urgency IN ('standard', 'urgent'));

-- Update the default value
ALTER TABLE applications ALTER COLUMN urgency SET DEFAULT 'standard';