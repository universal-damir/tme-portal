-- TME Portal - Add Country Field to Clients
-- Migration: 007_add_client_country.sql
-- Add country field and populate with smart logic based on existing city data

-- Add country column
ALTER TABLE clients ADD COLUMN country VARCHAR(100);

-- Populate country based on existing city data with smart mapping
UPDATE clients 
SET country = CASE 
    -- UAE Cities
    WHEN city IN ('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'UAQ', 'Umm Al Quwain') THEN 'United Arab Emirates'
    
    -- Other Countries based on city names
    WHEN city = 'Hong Kong' THEN 'Hong Kong'
    WHEN city = 'Qatar' THEN 'Qatar'
    WHEN city = 'Koeln' THEN 'Germany'
    WHEN city = 'Stuttgart' THEN 'Germany'
    WHEN city = 'Vienna' THEN 'Austria'
    
    -- Placeholder entries
    WHEN city = '-' THEN '-'
    
    -- Default fallback for any unmatched cities (assume UAE for TME business)
    ELSE 'United Arab Emirates'
END;

-- Create index for better performance on country field
CREATE INDEX idx_clients_country ON clients(country);

-- Add country to the search index for better search performance
DROP INDEX IF EXISTS idx_clients_search;
CREATE INDEX idx_clients_search ON clients USING gin(
    to_tsvector('english', 
        company_name || ' ' || 
        COALESCE(company_name_short, '') || ' ' || 
        COALESCE(management_first_name, '') || ' ' || 
        COALESCE(management_last_name, '') || ' ' ||
        COALESCE(management_email, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(country, '')
    )
);

-- Update the client management permissions to include country field access
UPDATE permissions 
SET description = 'View client database with management names and country information' 
WHERE name = 'client_management_read';

-- Add validation constraint to ensure country is not empty (except for placeholder entries)
ALTER TABLE clients ADD CONSTRAINT check_country_not_empty 
CHECK (country IS NOT NULL AND (country = '-' OR length(trim(country)) > 0));

-- Create a view with common country statistics for reporting
CREATE OR REPLACE VIEW client_country_stats AS
SELECT 
    country,
    COUNT(*) as client_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_clients,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_clients
FROM clients 
WHERE country != '-'
GROUP BY country 
ORDER BY client_count DESC;