-- Add CIT Return Letters Application Type
-- Migration: 008_add_cit_return_letters_type.sql
-- Adds 'cit-return-letters' to the applications type constraint

-- Drop the existing constraint
ALTER TABLE applications DROP CONSTRAINT applications_type_check;

-- Add the updated constraint with 'cit-return-letters' included
ALTER TABLE applications ADD CONSTRAINT applications_type_check 
CHECK (type IN (
    'golden-visa', 
    'cost-overview', 
    'company-services', 
    'taxation', 
    'corporate-changes', 
    'cit-return-letters'
));

-- Update permissions to include CIT return letters access
INSERT INTO permissions (name, description, resource, action) VALUES
('cit_return_letters_read', 'View CIT return letters applications', 'cit_return_letters', 'read'),
('cit_return_letters_write', 'Create and edit CIT return letters applications', 'cit_return_letters', 'write'),
('cit_return_letters_export', 'Export CIT return letters PDFs', 'cit_return_letters', 'export')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to admin users automatically
DO $$
DECLARE
    admin_user RECORD;
    perm_id INTEGER;
BEGIN
    -- Get all CIT return letters permission IDs
    FOR perm_id IN 
        SELECT id FROM permissions WHERE resource = 'cit_return_letters'
    LOOP
        -- Grant to all admin users
        FOR admin_user IN 
            SELECT id FROM users WHERE role = 'admin'
        LOOP
            INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
            VALUES (admin_user.id, perm_id, admin_user.id, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;