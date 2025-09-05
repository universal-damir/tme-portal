-- TME PORTAL PRODUCTION DATABASE DIAGNOSTICS
-- Use these commands to inspect and verify your production database state
-- Date: 2025-08-30

-- ==============================================================================
-- STEP 1: BASIC CONNECTION AND DATABASE INFO
-- ==============================================================================

-- Connect to your production database first, then run:

\echo '=========================================='
\echo 'TME PORTAL DATABASE DIAGNOSTICS'
\echo '=========================================='

-- Check database connection and basic info
SELECT 
    current_database() as database_name,
    current_user as connected_user,
    version() as postgresql_version,
    now() as current_time;

-- ==============================================================================
-- STEP 2: TABLE EXISTENCE CHECK
-- ==============================================================================

\echo ''
\echo '1. CHECKING TABLE EXISTENCE:'
\echo '---------------------------'

-- Check which core tables exist
SELECT 
    table_name,
    CASE WHEN table_name IN (
        'users', 'sessions', 'permissions', 'user_permissions', 'audit_logs', 'system_config'
    ) THEN 'CORE'
    WHEN table_name IN (
        'applications', 'notifications', 'review_messages'
    ) THEN 'REVIEW SYSTEM'
    WHEN table_name IN (
        'user_todos'
    ) THEN 'TODO SYSTEM'
    WHEN table_name IN (
        'clients'
    ) THEN 'CLIENT MANAGEMENT'
    ELSE 'OTHER'
    END as table_category,
    CASE 
        WHEN table_name = ANY(ARRAY['users', 'sessions', 'permissions', 'user_permissions', 'audit_logs', 'system_config', 'applications', 'notifications', 'review_messages', 'user_todos', 'clients']) 
        THEN '✅ REQUIRED'
        ELSE '⚠️  OTHER'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_category, table_name;

-- ==============================================================================
-- STEP 3: MISSING TABLES DETECTION
-- ==============================================================================

\echo ''
\echo '2. MISSING REQUIRED TABLES:'
\echo '---------------------------'

-- Show which critical tables are missing
WITH required_tables AS (
    SELECT unnest(ARRAY[
        'users', 'sessions', 'permissions', 'user_permissions', 'audit_logs', 'system_config',
        'applications', 'notifications', 'review_messages', 'user_todos', 'clients'
    ]) as table_name
),
existing_tables AS (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT 
    rt.table_name,
    CASE 
        WHEN rt.table_name IN ('users', 'sessions', 'permissions', 'user_permissions', 'audit_logs', 'system_config') THEN 'CORE'
        WHEN rt.table_name IN ('applications', 'notifications', 'review_messages') THEN 'REVIEW SYSTEM'
        WHEN rt.table_name = 'user_todos' THEN 'TODO SYSTEM'
        WHEN rt.table_name = 'clients' THEN 'CLIENT MANAGEMENT'
    END as category,
    '❌ MISSING' as status
FROM required_tables rt
LEFT JOIN existing_tables et ON rt.table_name = et.table_name
WHERE et.table_name IS NULL
ORDER BY category;

-- ==============================================================================
-- STEP 4: USER DATA VERIFICATION
-- ==============================================================================

\echo ''
\echo '3. USER DATA VERIFICATION:'
\echo '--------------------------'

-- Check user count and basic info
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
    COUNT(*) FILTER (WHERE role = 'manager') as manager_users,
    COUNT(*) FILTER (WHERE role = 'employee') as employee_users
FROM users;

-- Show sample users (without sensitive data)
SELECT 
    id, 
    employee_code, 
    email, 
    full_name, 
    department, 
    role, 
    status,
    created_at::date as created_date
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- ==============================================================================
-- STEP 5: CHECK FOR FOREIGN KEY ISSUES
-- ==============================================================================

\echo ''
\echo '4. FOREIGN KEY CONSTRAINTS:'
\echo '---------------------------'

-- List all foreign key constraints to identify what might be missing
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ==============================================================================
-- STEP 6: CHECK SPECIFIC FUNCTIONALITY
-- ==============================================================================

\echo ''
\echo '5. FUNCTIONALITY TESTS:'
\echo '-----------------------'

-- Test if each system component would work
DO $$
DECLARE
    has_users boolean := false;
    has_applications boolean := false;
    has_notifications boolean := false;
    has_todos boolean := false;
    has_clients boolean := false;
BEGIN
    -- Check each critical table
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') INTO has_users;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') INTO has_applications;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') INTO has_notifications;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_todos') INTO has_todos;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') INTO has_clients;
    
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCTIONALITY STATUS:';
    RAISE NOTICE '- User Login System: %', CASE WHEN has_users THEN '✅ WORKING' ELSE '❌ BROKEN' END;
    RAISE NOTICE '- Review System: %', CASE WHEN has_applications AND has_notifications THEN '✅ WORKING' ELSE '❌ BROKEN' END;
    RAISE NOTICE '- Notifications: %', CASE WHEN has_notifications THEN '✅ WORKING' ELSE '❌ BROKEN' END;
    RAISE NOTICE '- Todo System: %', CASE WHEN has_todos THEN '✅ WORKING' ELSE '❌ BROKEN' END;
    RAISE NOTICE '- Client Management: %', CASE WHEN has_clients THEN '✅ WORKING' ELSE '❌ BROKEN' END;
    RAISE NOTICE '';
    
    IF NOT has_applications THEN
        RAISE NOTICE '⚠️  CRITICAL: Applications table missing - Golden Visa, Cost Overview, Company Services will not work';
    END IF;
    
    IF NOT has_notifications THEN
        RAISE NOTICE '⚠️  CRITICAL: Notifications table missing - No in-app notifications will work';
    END IF;
    
    IF NOT has_todos THEN
        RAISE NOTICE '⚠️  WARNING: Todo system missing - Task management features disabled';
    END IF;
    
    IF NOT has_clients THEN
        RAISE NOTICE '⚠️  CRITICAL: Client management missing - Cannot manage client data';
    END IF;
END $$;

-- ==============================================================================
-- STEP 7: SHOW RECOVERY STATUS
-- ==============================================================================

\echo ''
\echo '6. RECOVERY RECOMMENDATIONS:'
\echo '----------------------------'

DO $$
DECLARE
    missing_count integer;
BEGIN
    -- Count missing critical tables
    WITH required_tables AS (
        SELECT unnest(ARRAY[
            'applications', 'notifications', 'review_messages', 'user_todos', 'clients'
        ]) as table_name
    ),
    existing_tables AS (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    )
    SELECT COUNT(*)
    FROM required_tables rt
    LEFT JOIN existing_tables et ON rt.table_name = et.table_name
    WHERE et.table_name IS NULL
    INTO missing_count;
    
    RAISE NOTICE '';
    IF missing_count = 0 THEN
        RAISE NOTICE '🎉 EXCELLENT: All required tables exist!';
        RAISE NOTICE '✅ Your production database schema is complete.';
    ELSE
        RAISE NOTICE '🚨 CRITICAL: % required tables are missing', missing_count;
        RAISE NOTICE '';
        RAISE NOTICE 'IMMEDIATE ACTION REQUIRED:';
        RAISE NOTICE '1. Run: psql -d your_database -f PRODUCTION_DATABASE_RECOVERY.sql';
        RAISE NOTICE '2. This will create all missing tables safely';
        RAISE NOTICE '3. Verify with: psql -d your_database -f PRODUCTION_DATABASE_DIAGNOSTICS.sql';
        RAISE NOTICE '4. Test application functionality';
    END IF;
    RAISE NOTICE '';
END $$;

\echo '=========================================='
\echo 'DIAGNOSTICS COMPLETE'
\echo '=========================================='