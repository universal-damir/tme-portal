-- TME Portal - Split Management Names Migration
-- Migration: 006_split_management_names.sql
-- Split management_name into management_first_name and management_last_name

-- Add new columns for first and last names
ALTER TABLE clients ADD COLUMN management_first_name VARCHAR(150);
ALTER TABLE clients ADD COLUMN management_last_name VARCHAR(150);

-- Split existing management names into first and last names
-- Logic: First word = first name, everything else = last name
-- Special cases: "-" stays as "-" in both fields
UPDATE clients 
SET 
    management_first_name = CASE 
        WHEN management_name = '-' THEN '-'
        WHEN position(' ' in management_name) = 0 THEN management_name  -- Single word
        ELSE substring(management_name from 1 for position(' ' in management_name) - 1)  -- First word
    END,
    management_last_name = CASE 
        WHEN management_name = '-' THEN '-'
        WHEN position(' ' in management_name) = 0 THEN ''  -- Single word, empty last name
        ELSE trim(substring(management_name from position(' ' in management_name) + 1))  -- Everything after first space
    END;

-- Add indexes for better performance on new fields
CREATE INDEX idx_clients_management_first_name ON clients(management_first_name);
CREATE INDEX idx_clients_management_last_name ON clients(management_last_name);

-- Add computed column function to maintain management_name compatibility
-- This creates a virtual full name from first + last names when needed
CREATE OR REPLACE FUNCTION get_full_management_name(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Handle special cases
    IF first_name = '-' AND last_name = '-' THEN
        RETURN '-';
    END IF;
    
    -- Handle empty last name
    IF last_name IS NULL OR last_name = '' THEN
        RETURN COALESCE(first_name, '');
    END IF;
    
    -- Handle empty first name
    IF first_name IS NULL OR first_name = '' THEN
        RETURN COALESCE(last_name, '');
    END IF;
    
    -- Normal case: combine first + last
    RETURN first_name || ' ' || last_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a computed column view for backward compatibility (optional)
-- This allows existing queries using management_name to still work
CREATE OR REPLACE VIEW clients_with_full_name AS
SELECT 
    *,
    get_full_management_name(management_first_name, management_last_name) as computed_management_name
FROM clients;

-- Update search indexes to include new name fields
DROP INDEX IF EXISTS idx_clients_company_name;
CREATE INDEX idx_clients_search ON clients USING gin(
    to_tsvector('english', 
        company_name || ' ' || 
        COALESCE(company_name_short, '') || ' ' || 
        COALESCE(management_first_name, '') || ' ' || 
        COALESCE(management_last_name, '') || ' ' ||
        COALESCE(management_email, '')
    )
);

-- Add constraints to ensure data integrity
-- Make sure at least one of first/last name is not empty (unless it's the "-" placeholder)
ALTER TABLE clients ADD CONSTRAINT check_management_names 
CHECK (
    (management_first_name = '-' AND management_last_name = '-') OR
    (management_first_name IS NOT NULL AND management_first_name != '') OR 
    (management_last_name IS NOT NULL AND management_last_name != '')
);

-- Update the client management permissions to reflect the new fields
UPDATE permissions 
SET description = 'View client database with split management names' 
WHERE name = 'client_management_read';