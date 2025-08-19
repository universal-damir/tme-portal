-- Grant Invoice Permissions to DN user (damir@tme-services.com)
-- This script grants all invoice-related permissions to user DN

-- First, ensure the invoice permissions exist (they should from migration 004)
-- This is idempotent - won't fail if they already exist
INSERT INTO permissions (name, description, resource, action) VALUES
('invoice_read', 'View invoices', 'invoicing', 'read'),
('invoice_write', 'Create and edit invoices', 'invoicing', 'write'),
('invoice_approve', 'Approve invoices', 'invoicing', 'approve'),
('invoice_send', 'Send invoices to clients', 'invoicing', 'send'),
('payment_record', 'Record invoice payments', 'invoicing', 'payment'),
('client_manage', 'Manage invoice clients', 'invoicing', 'client_manage')
ON CONFLICT (name) DO NOTHING;

-- Grant all invoice permissions to DN user
-- First, get the user ID for DN
DO $$
DECLARE
    v_user_id INTEGER;
    v_permission_id INTEGER;
    v_permission_name TEXT;
BEGIN
    -- Get DN user ID (case-insensitive email check)
    SELECT id INTO v_user_id 
    FROM users 
    WHERE employee_code LIKE '70%' 
      OR LOWER(email) = LOWER('damir@tme-services.com')
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Grant each invoice permission
        FOR v_permission_name IN 
            SELECT unnest(ARRAY[
                'invoice_read',
                'invoice_write', 
                'invoice_approve',
                'invoice_send',
                'payment_record',
                'client_manage'
            ])
        LOOP
            -- Get permission ID
            SELECT id INTO v_permission_id
            FROM permissions
            WHERE name = v_permission_name;
            
            IF v_permission_id IS NOT NULL THEN
                -- Grant permission (or update if exists)
                INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
                VALUES (v_user_id, v_permission_id, v_user_id, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, permission_id) DO NOTHING;
                
                RAISE NOTICE 'Granted % permission to DN user', v_permission_name;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'All invoice permissions granted to DN user (ID: %)', v_user_id;
    ELSE
        RAISE WARNING 'User DN (damir@tme-services.com) not found in database';
    END IF;
END $$;

-- Also grant to other admin users if needed
-- Grant to UB (Uwe) as admin
DO $$
DECLARE
    v_user_id INTEGER;
    v_permission_id INTEGER;
    v_permission_name TEXT;
BEGIN
    -- Get UB user ID
    SELECT id INTO v_user_id 
    FROM users 
    WHERE employee_code = '01'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Grant each invoice permission
        FOR v_permission_name IN 
            SELECT unnest(ARRAY[
                'invoice_read',
                'invoice_write', 
                'invoice_approve',
                'invoice_send',
                'payment_record',
                'client_manage'
            ])
        LOOP
            -- Get permission ID
            SELECT id INTO v_permission_id
            FROM permissions
            WHERE name = v_permission_name;
            
            IF v_permission_id IS NOT NULL THEN
                -- Grant permission (or update if exists)
                INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
                VALUES (v_user_id, v_permission_id, v_user_id, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, permission_id) DO NOTHING;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'All invoice permissions granted to UB admin user (ID: %)', v_user_id;
    END IF;
END $$;

-- Verify permissions were granted
SELECT 
    u.employee_code,
    u.email,
    u.full_name,
    string_agg(p.name, ', ' ORDER BY p.name) as invoice_permissions
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE p.resource = 'invoicing'
  AND u.employee_code IN ('70', '01')
GROUP BY u.employee_code, u.email, u.full_name;