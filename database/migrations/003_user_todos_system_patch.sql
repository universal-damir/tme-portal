-- Fix migration issues for 003_user_todos_system.sql
-- Phase 1: Todo System Migration Patches

-- Fix 1: Remove problematic overdue index that requires immutable function
DROP INDEX IF EXISTS idx_user_todos_overdue;

-- Create simpler overdue index without function call
CREATE INDEX IF NOT EXISTS idx_user_todos_overdue_simple 
ON user_todos(due_date, status) 
WHERE status IN ('pending', 'in_progress');

-- Fix 2: Create trigger without IF NOT EXISTS (not supported in older PostgreSQL)
DROP TRIGGER IF EXISTS update_user_todos_updated_at ON user_todos;

CREATE TRIGGER update_user_todos_updated_at 
    BEFORE UPDATE ON user_todos 
    FOR EACH ROW EXECUTE FUNCTION update_user_todos_updated_at();

-- Fix 3: Grant permissions directly to users instead of using role_permissions table
-- Since role_permissions doesn't exist, we'll use user_permissions directly

-- Get the permission IDs for todo permissions
DO $$
DECLARE
    view_todos_id integer;
    manage_todos_id integer;
    user_record record;
BEGIN
    -- Get permission IDs
    SELECT id INTO view_todos_id FROM permissions WHERE name = 'view_todos';
    SELECT id INTO manage_todos_id FROM permissions WHERE name = 'manage_todos';
    
    -- Only proceed if permissions exist
    IF view_todos_id IS NOT NULL AND manage_todos_id IS NOT NULL THEN
        -- Grant permissions to all existing users
        FOR user_record IN SELECT id FROM users LOOP
            -- Grant view_todos permission
            INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
            VALUES (user_record.id, view_todos_id, user_record.id, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
            
            -- Grant manage_todos permission
            INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at)
            VALUES (user_record.id, manage_todos_id, user_record.id, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Todo permissions granted to % users', (SELECT COUNT(*) FROM users);
    ELSE
        RAISE WARNING 'Todo permissions not found, skipping permission grants';
    END IF;
END $$;